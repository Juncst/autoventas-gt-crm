const bcrypt = require("bcrypt");
const pool = require("../db");
const { esIdValido, validarUsuario } = require("./validacionUsuarios");

const listarUsuarios = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.correo,
        u.activo,
        u.creado_en,
        u.actualizado_en,
        r.id AS rol_id,
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      ORDER BY u.id
    `);

    res.json({
      ok: true,
      usuarios: resultado.rows,
    });
  } catch (error) {
    console.error("Error al consultar usuarios:", error.message);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudieron obtener los usuarios",
    });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { nombre, apellido, correo, password, rolId } = req.body || {};
    const mensaje = validarUsuario(req.body || {}, true);
    if (mensaje) return res.status(400).json({ ok: false, mensaje });

    const rol = await pool.query(
      "SELECT id FROM roles WHERE id = $1",
      [rolId]
    );

    if (rol.rows.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El rol seleccionado no existe",
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const existente = await pool.query(
      "SELECT id FROM usuarios WHERE LOWER(correo) = LOWER($1)",
      [correoNormalizado]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe un usuario con ese correo",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios
        (rol_id, nombre, apellido, correo, password_hash, activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, rol_id, nombre, apellido, correo, activo`,
      [
        rolId,
        nombre.trim(),
        apellido.trim(),
        correoNormalizado,
        passwordHash,
      ]
    );

    res.status(201).json({
      ok: true,
      mensaje: "Usuario creado correctamente",
      usuario: resultado.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ ok: false, mensaje: "Ya existe un usuario con ese correo" });
    console.error("Error al crear usuario:", error.message);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo crear el usuario",
    });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, rolId, password } = req.body || {};
    if (!esIdValido(id)) return res.status(400).json({ ok: false, mensaje: "Identificador inválido" });
    const mensaje = validarUsuario(req.body || {}, false);
    if (mensaje) return res.status(400).json({ ok: false, mensaje });
    const rol = await pool.query("SELECT id FROM roles WHERE id = $1", [rolId]);
    if (!rol.rows.length) return res.status(400).json({ ok: false, mensaje: "El rol seleccionado no existe" });

    const usuario = await pool.query(
      "SELECT id FROM usuarios WHERE id = $1",
      [id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const correoExiste = await pool.query(
      `SELECT id
       FROM usuarios
       WHERE LOWER(correo) = LOWER($1)
       AND id <> $2`,
      [correoNormalizado, id]
    );

    if (correoExiste.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        mensaje: "Ya existe otro usuario con ese correo",
      });
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.query(
        `UPDATE usuarios
         SET rol_id = $1,
             nombre = $2,
             apellido = $3,
             correo = $4,
             password_hash = $5
         WHERE id = $6`,
        [
          rolId,
          nombre.trim(),
          apellido.trim(),
          correoNormalizado,
          passwordHash,
          id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE usuarios
         SET rol_id = $1,
             nombre = $2,
             apellido = $3,
             correo = $4
         WHERE id = $5`,
        [
          rolId,
          nombre.trim(),
          apellido.trim(),
          correoNormalizado,
          id,
        ]
      );
    }

    res.json({
      ok: true,
      mensaje: "Usuario actualizado correctamente",
    });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ ok: false, mensaje: "Ya existe otro usuario con ese correo" });
    console.error("Error al actualizar usuario:", error.message);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo actualizar el usuario",
    });
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body || {};
    if (!esIdValido(id)) return res.status(400).json({ ok: false, mensaje: "Identificador inválido" });

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        ok: false,
        mensaje: "Estado inválido",
      });
    }

    if (Number(id) === Number(req.usuario.id) && activo === false) {
      return res.status(400).json({
        ok: false,
        mensaje: "No puedes desactivar tu propio usuario",
      });
    }

    const resultado = await pool.query(
      `UPDATE usuarios
       SET activo = $1
       WHERE id = $2
       RETURNING id, activo`,
      [activo, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Usuario no encontrado",
      });
    }

    res.json({
      ok: true,
      mensaje: activo
        ? "Usuario activado correctamente"
        : "Usuario desactivado correctamente",
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error.message);

    res.status(500).json({
      ok: false,
      mensaje: "No se pudo cambiar el estado del usuario",
    });
  }
};

module.exports = {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
};
