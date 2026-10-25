const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../src/db");

// Solo se usa en este proceso de pruebas. Nunca se conecta a PostgreSQL.
process.env.JWT_SECRET = "clave-exclusiva-para-pruebas-automatizadas";
let consultar;
pool.query = (...args) => consultar(...args);
const app = express();
app.use(express.json());
app.use("/api/auth", require("../src/routes/authRoutes"));
app.use("/api/usuarios", require("../src/routes/usuariosRoutes"));
app.use("/api/roles", require("../src/routes/rolesRoutes"));
let server;
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
});

test("Autenticación, permisos y usuarios mediante HTTP", async t => {
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const usuario = { id: 1, nombre: "Usuario", apellido: "Prueba", correo: "prueba@example.com", activo: true, rol_id: 1, rolId: 1, rol: "ADMINISTRADOR" };
  const password = "PruebaSegura123";
  const hash = await bcrypt.hash(password, 4);
  const token = jwt.sign({ id: 1, rol: "ADMINISTRADOR" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const datosUsuario = { nombre: "Nuevo", apellido: "Usuario", correo: "nuevo@example.com", rolId: 2, password };
  async function pedir(ruta, { method = "GET", body, credencial = token } = {}) {
    const response = await fetch(base + ruta, {
      method,
      headers: { "Content-Type": "application/json", ...(credencial ? { Authorization: `Bearer ${credencial}` } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, datos: await response.json() };
  }
  const noConsultar = () => { throw new Error("No debe consultar la base de datos"); };
  const autenticar = async (sql) => {
    assert.match(sql, /WHERE u.id = \$1/);
    return { rows: [usuario] };
  };

  await t.test("rechaza solicitudes sin token e inválidas antes de consultar BD", async () => {
    consultar = noConsultar;
    for (const credencial of [null, "invalido", jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: -1 })]) {
      assert.equal((await pedir("/usuarios", { credencial })).status, 401);
    }
  });
  await t.test("login valida tipos y cuerpo ausente", async () => {
    consultar = noConsultar;
    for (const body of [undefined, {}, { correo: 42, password }, { correo: usuario.correo, password: {} }]) {
      assert.equal((await pedir("/auth/login", { method: "POST", body, credencial: null })).status, 400);
    }
  });
  await t.test("login correcto devuelve JWT y usuario sin hash", async () => {
    consultar = async () => ({ rows: [{ ...usuario, password_hash: hash }] });
    const respuesta = await pedir("/auth/login", { method: "POST", body: { correo: usuario.correo, password } });
    assert.equal(respuesta.status, 200);
    assert.equal(jwt.verify(respuesta.datos.token, process.env.JWT_SECRET).id, 1);
    assert.equal(respuesta.datos.usuario.rol, "ADMINISTRADOR");
    assert.equal(respuesta.datos.usuario.password_hash, undefined);
  });
  await t.test("credenciales incorrectas y usuario inactivo", async () => {
    consultar = async () => ({ rows: [] });
    assert.equal((await pedir("/auth/login", { method: "POST", body: { correo: usuario.correo, password } })).status, 401);
    consultar = async () => ({ rows: [{ ...usuario, activo: false, password_hash: hash }] });
    assert.equal((await pedir("/auth/login", { method: "POST", body: { correo: usuario.correo, password: "incorrecta" } })).status, 401);
    assert.equal((await pedir("/auth/login", { method: "POST", body: { correo: usuario.correo, password } })).status, 403);
  });
  await t.test("revoca acceso al desactivar o eliminar un usuario con JWT vigente", async () => {
    for (const rows of [[], [{ ...usuario, activo: false }]]) {
      consultar = async () => ({ rows });
      assert.equal((await pedir("/auth/me")).status, 401);
    }
  });
  await t.test("usa el rol de BD aunque el JWT aún diga ADMINISTRADOR", async () => {
    consultar = async () => ({ rows: [{ ...usuario, rol: "VENDEDOR", rolId: 3 }] });
    assert.equal((await pedir("/usuarios")).status, 403);
    assert.equal((await pedir("/auth/me")).datos.usuario.rol, "VENDEDOR");
  });
  await t.test("un fallo de BD no se presenta como credenciales inválidas", async () => {
    consultar = async () => { throw new Error("BD no disponible"); };
    assert.equal((await pedir("/auth/me")).status, 503);
  });
  await t.test("administrador lista usuarios y roles", async () => {
    consultar = async sql => sql.includes("WHERE u.id = $1") ? { rows: [usuario] } : { rows: [{ id: 2, nombre: "Prueba" }] };
    assert.equal((await pedir("/usuarios")).datos.usuarios.length, 1);
    assert.equal((await pedir("/roles")).datos.roles.length, 1);
  });
  await t.test("crear rechaza tipos incorrectos, correo inválido y password largo", async () => {
    consultar = autenticar;
    for (const body of [{ ...datosUsuario, nombre: {} }, { ...datosUsuario, correo: "invalido" }, { ...datosUsuario, password: 12345678 }, { ...datosUsuario, password: "á".repeat(37) }, { ...datosUsuario, rolId: "incorrecto" }]) {
      assert.equal((await pedir("/usuarios", { method: "POST", body })).status, 400);
    }
  });
  await t.test("crear normaliza el correo y guarda bcrypt", async () => {
    consultar = async (sql, valores) => {
      if (sql.includes("WHERE u.id = $1")) return { rows: [usuario] };
      if (sql.includes("FROM roles")) return { rows: [{ id: 2 }] };
      if (sql.includes("FROM usuarios")) return { rows: [] };
      assert.match(sql, /INSERT INTO usuarios/);
      assert.equal(valores[3], "nuevo@example.com");
      assert.equal(await bcrypt.compare(password, valores[4]), true);
      return { rows: [{ id: 2, correo: valores[3] }] };
    };
    const respuesta = await pedir("/usuarios", { method: "POST", body: { ...datosUsuario, correo: " NUEVO@example.com " } });
    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.datos.usuario.password_hash, undefined);
  });
  await t.test("editar comprueba rol y rechaza identificadores inválidos", async () => {
    consultar = async sql => sql.includes("WHERE u.id = $1") ? { rows: [usuario] } : { rows: [] };
    assert.equal((await pedir("/usuarios/2", { method: "PUT", body: datosUsuario })).status, 400);
    assert.equal((await pedir("/usuarios/abc", { method: "PUT", body: datosUsuario })).status, 400);
  });
  await t.test("editar con contraseña vacía conserva el hash; nueva contraseña usa bcrypt", async () => {
    for (const nuevaPassword of ["", password]) {
      let actualizado = false;
      consultar = async (sql, valores) => {
        if (sql.includes("UPDATE usuarios")) {
          actualizado = true;
          assert.equal(sql.includes("password_hash"), Boolean(nuevaPassword));
          if (nuevaPassword) assert.equal(await bcrypt.compare(password, valores[4]), true);
          return { rows: [] };
        }
        if (sql.includes("LOWER(correo)")) return { rows: [] };
        return { rows: [usuario] };
      };
      assert.equal((await pedir("/usuarios/2", { method: "PUT", body: { ...datosUsuario, password: nuevaPassword } })).status, 200);
      assert.equal(actualizado, true);
    }
  });
  await t.test("conflicto de correo devuelve 409 incluso ante concurrencia", async () => {
    consultar = async sql => {
      if (sql.includes("INSERT INTO usuarios")) throw Object.assign(new Error("Duplicado"), { code: "23505" });
      if (sql.includes("LOWER(correo)")) return { rows: [] };
      return { rows: [usuario] };
    };
    assert.equal((await pedir("/usuarios", { method: "POST", body: datosUsuario })).status, 409);
  });
  await t.test("estado exige booleano e impide la propia desactivación", async () => {
    consultar = autenticar;
    assert.equal((await pedir("/usuarios/2/estado", { method: "PATCH", body: { activo: "false" } })).status, 400);
    assert.equal((await pedir("/usuarios/1/estado", { method: "PATCH", body: { activo: false } })).status, 400);
    consultar = async sql => sql.includes("WHERE u.id = $1") ? { rows: [usuario] } : { rows: [{ id: 2, activo: false }] };
    assert.equal((await pedir("/usuarios/2/estado", { method: "PATCH", body: { activo: false } })).status, 200);
  });
});
