const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const pool = require('../src/db');

// Sustituye únicamente el límite de persistencia; nunca accede a PostgreSQL.
const consultaOriginal = pool.query;
let consultar;
pool.query = (...args) => consultar(...args);
const app = express();
app.use(express.json());
for (const modulo of ['clientes', 'prospectos', 'vehiculos', 'cotizaciones']) {
  app.use(`/api/${modulo}`, require(`../src/routes/${modulo}`));
}
let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(() => {
  consultar = () => assert.fail('Los datos inválidos no deben llegar a PostgreSQL');
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  pool.query = consultaOriginal;
  await pool.end();
});
async function enviar(modulo, body, method = 'POST') {
  const respuesta = await fetch(`${base}/${modulo}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: respuesta.status, datos: await respuesta.json() };
}
const vehiculo = {
  codigo: 'V-PRUEBA', marca: 'Toyota', modelo: 'Corolla', anio: 2025,
  tipo: 'Sedán', combustible: 'Gasolina', transmision: 'Automática', precio: 100000,
};
const cotizacion = {
  codigo: 'C-PRUEBA', cliente_id: 1, vehiculo_id: 2, asesor: 'Asesor Prueba', monto: 100000,
};

test('clientes: crear y editar requieren un nombre no vacío', async () => {
  for (const nombre of [undefined, '', '   ']) {
    for (const [ruta, metodo] of [['clientes', 'POST'], ['clientes/1', 'PUT']]) {
      const respuesta = await enviar(ruta, { nombre }, metodo);
      assert.equal(respuesta.status, 400);
      assert.match(respuesta.datos.mensaje, /nombre.*obligatorio/);
    }
  }
});

test('prospectos: crear y editar requieren nombre, teléfono, correo y vehículo', async () => {
  const prospecto = { nombre: 'Ana', telefono: '55555555', correo: 'ana@example.com', vehiculo: 'Corolla' };
  for (const campo of Object.keys(prospecto)) {
    for (const valor of [undefined, '   ']) {
      for (const [ruta, metodo] of [['prospectos', 'POST'], ['prospectos/1', 'PUT']]) {
        const respuesta = await enviar(ruta, { ...prospecto, [campo]: valor }, metodo);
        assert.equal(respuesta.status, 400);
        assert.match(respuesta.datos.mensaje, /campos obligatorios/);
      }
    }
  }
});

test('vehículos: rechaza precio, año y kilometraje fuera de las reglas existentes', async () => {
  const invalidos = [
    { precio: -1 }, { precio: 'abc' }, { precio: '' },
    { anio: 1885 }, { anio: new Date().getFullYear() + 2 }, { anio: 2025.5 },
    { kilometraje: -1 }, { kilometraje: 1.5 },
  ];
  for (const cambio of invalidos) {
    const respuesta = await enviar('vehiculos', { ...vehiculo, ...cambio });
    assert.equal(respuesta.status, 400, JSON.stringify(cambio));
    assert.equal(typeof respuesta.datos.mensaje, 'string');
  }
});

test('vehículos: rechaza estados y condiciones no permitidos', async () => {
  for (const cambio of [{ estado: 'Desconocido' }, { condicion: 'Usado' }]) {
    const respuesta = await enviar('vehiculos', { ...vehiculo, ...cambio });
    assert.equal(respuesta.status, 400);
    assert.match(respuesta.datos.mensaje, /debe ser:/);
  }
});

test('vehículos: registra datos válidos con estado y kilometraje predeterminados', async () => {
  let consultas = 0;
  consultar = async (sql, valores) => {
    consultas++;
    assert.match(sql, /INSERT INTO public.vehiculos/);
    assert.equal(valores[0], vehiculo.codigo);
    assert.equal(valores[10], 'Nuevo');
    assert.equal(valores[11], 0);
    assert.equal(valores[12], vehiculo.precio);
    assert.equal(valores[13], 'Disponible');
    return { rows: [{ id: 7, ...vehiculo, estado: 'Disponible' }] };
  };
  const respuesta = await enviar('vehiculos', vehiculo);
  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.datos.id, 7);
  assert.equal(respuesta.datos.estado, 'Disponible');
  assert.equal(consultas, 1);
});

test('cotizaciones: requiere cliente y vehículo con identificadores válidos', async () => {
  for (const campo of ['cliente_id', 'vehiculo_id']) {
    for (const valor of [undefined, 0, -1, 'abc', 1.5]) {
      const respuesta = await enviar('cotizaciones', { ...cotizacion, [campo]: valor });
      assert.equal(respuesta.status, 400);
      assert.ok(respuesta.datos.mensaje.includes(campo));
    }
  }
});

test('cotizaciones: rechaza montos, estados y fechas inválidos', async () => {
  for (const cambio of [
    { monto: -1 }, { monto: 'abc' }, { monto: '' }, { estado: 'Desconocido' },
    { fecha: '2026-02-30' }, { fecha: '2026-11-17', validez: '2026-11-16' },
  ]) {
    const respuesta = await enviar('cotizaciones', { ...cotizacion, ...cambio });
    assert.equal(respuesta.status, 400, JSON.stringify(cambio));
    assert.equal(typeof respuesta.datos.mensaje, 'string');
  }
});

test('cotizaciones: requiere código y asesor antes de persistir', async () => {
  for (const campo of ['codigo', 'asesor']) {
    for (const valor of [undefined, '', '   ']) {
      const respuesta = await enviar('cotizaciones', { ...cotizacion, [campo]: valor });
      assert.equal(respuesta.status, 400);
      assert.match(respuesta.datos.mensaje, /obligatorio/);
    }
  }
});
