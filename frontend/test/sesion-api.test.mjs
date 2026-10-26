import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { leerSesion, guardarSesion, vencimientoToken } from '../src/services/sesion.js';
import { solicitar } from '../src/services/api.js';

beforeEach(() => {
  const datos = new Map();
  globalThis.sessionStorage = {
    getItem: clave => datos.get(clave) ?? null,
    setItem: (clave, valor) => datos.set(clave, valor),
    removeItem: clave => datos.delete(clave),
  };
  globalThis.window = new EventTarget();
});
afterEach(() => { mock.restoreAll(); delete globalThis.sessionStorage; delete globalThis.window; });

test('sesión se conserva al leerla y se elimina al cerrar', () => {
  assert.equal(leerSesion(), null);
  const sesion = { token: 'token-prueba', usuario: { id: 2, rol: 'VENDEDOR' } };
  guardarSesion(sesion);
  assert.deepEqual(leerSesion(), sesion);
  guardarSesion(null);
  assert.equal(leerSesion(), null);
});
test('almacenamiento corrupto no restaura una sesión', () => {
  sessionStorage.setItem('autoventas.sesion', '{');
  assert.equal(leerSesion(), null);
  sessionStorage.setItem('autoventas.sesion', JSON.stringify({ token: 123 }));
  assert.equal(leerSesion(), null);
});
test('vencimiento identifica token inválido o expirado', () => {
  const exp = Math.floor(Date.now() / 1000) - 60;
  const token = `cabecera.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.firma`;
  assert.equal(vencimientoToken(token), exp * 1000);
  assert.ok(vencimientoToken(token) < Date.now());
  assert.equal(vencimientoToken('invalido'), 0);
});
test('login envía JSON sin adjuntar una sesión anterior', async () => {
  guardarSesion({ token: 'anterior', usuario: { id: 1 } });
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ ok: true }));
  await solicitar('/auth/login', { method: 'POST', body: { correo: 'prueba@example.com', password: 'prueba' }, token: null });
  const [url, opciones] = fetchMock.mock.calls[0].arguments;
  assert.match(url, /\/api\/auth\/login$/);
  assert.equal(opciones.headers.Authorization, undefined);
  assert.equal(opciones.headers['Content-Type'], 'application/json');
  assert.equal(JSON.parse(opciones.body).correo, 'prueba@example.com');
});
test('consultas protegidas incluyen Bearer; 401 informa sesión expirada', async () => {
  guardarSesion({ token: 'actual', usuario: { id: 1 } });
  let tokenExpirado;
  window.addEventListener('sesion-expirada', evento => { tokenExpirado = evento.detail; });
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ mensaje: 'Sesión inválida' }, { status: 401 }));
  await assert.rejects(solicitar('/usuarios'), error => error.status === 401 && error.message === 'Sesión inválida');
  assert.equal(fetchMock.mock.calls[0].arguments[1].headers.Authorization, 'Bearer actual');
  assert.equal(tokenExpirado, 'actual');
});
test('403 de usuario inactivo muestra el mensaje y no emite cierre de sesión', async () => {
  let expiraciones = 0;
  window.addEventListener('sesion-expirada', () => { expiraciones++; });
  mock.method(globalThis, 'fetch', async () => Response.json({ mensaje: 'Usuario inactivo' }, { status: 403 }));
  await assert.rejects(solicitar('/auth/login', { token: null }), /Usuario inactivo/);
  assert.equal(expiraciones, 0);
});
test('errores de red, respuestas no JSON y cancelación se distinguen', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(solicitar('/roles'), /No se pudo conectar/);
  fetchMock.mock.mockImplementation(async () => new Response('<html>Error</html>', { status: 502 }));
  await assert.rejects(solicitar('/roles'), /No se pudo completar/);
  fetchMock.mock.mockImplementation(async () => { throw new DOMException('Cancelado', 'AbortError'); });
  await assert.rejects(solicitar('/roles'), error => error.name === 'AbortError');
});
