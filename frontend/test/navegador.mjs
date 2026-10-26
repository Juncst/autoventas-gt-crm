// Prueba de interacción con Chrome/Edge instalado, sin librerías adicionales.
// La API de prueba vive únicamente en memoria y no utiliza PostgreSQL.
import assert from 'node:assert/strict';
import { createServer as crearHttp } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as crearVite } from 'vite';

const navegador = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!navegador) throw new Error('Se requiere Chrome/Edge instalado o CHROME_PATH');
const roles = [{ id: 1, nombre: 'ADMINISTRADOR' }, { id: 2, nombre: 'GERENTE' }, { id: 3, nombre: 'VENDEDOR' }];
const usuarios = [
  { id: 1, nombre: 'Admin', apellido: 'Prueba', correo: 'admin@example.com', rol_id: 1, rol: 'ADMINISTRADOR', activo: true },
  { id: 2, nombre: 'Vendedor', apellido: 'Prueba', correo: 'vendedor@example.com', rol_id: 3, rol: 'VENDEDOR', activo: true },
];
const escrituras = [];
const api = crearHttp(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  const enviar = (status, datos) => { res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(datos)); };
  let texto = '';
  for await (const fragmento of req) texto += fragmento;
  const body = texto ? JSON.parse(texto) : {};
  if (req.url === '/api/auth/login') {
    const usuario = usuarios.find(usuario => usuario.correo === body.correo);
    if (body.password === 'Inactivo123') return enviar(403, { mensaje: 'Usuario inactivo' });
    if (!usuario || body.password !== 'Prueba123') return enviar(401, { mensaje: 'Credenciales incorrectas' });
    const payload = Buffer.from(JSON.stringify({ id: usuario.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
    return enviar(200, { token: `prueba.${payload}.prueba`, usuario });
  }
  let usuario;
  try {
    const payload = JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64url').toString());
    usuario = usuarios.find(usuario => usuario.id === payload.id);
  } catch { /* Sin sesión de prueba */ }
  if (!usuario?.activo) return enviar(401, { mensaje: 'Sesión inválida' });
  if (req.url === '/api/auth/me') return enviar(200, { usuario });
  if (req.url === '/api/roles') return enviar(200, { roles });
  if (req.url === '/api/clientes') return enviar(200, [{ id: 1 }, { id: 2 }]);
  if (req.url === '/api/prospectos') return enviar(500, { mensaje: 'Prospectos no disponible en la prueba' });
  if (req.url.startsWith('/api/usuarios')) {
    if (usuario.rol !== 'ADMINISTRADOR') return enviar(403, { mensaje: 'Acceso restringido' });
    if (req.method === 'GET') return enviar(200, { usuarios });
    escrituras.push({ method: req.method, body });
    const id = Number(req.url.split('/')[3]);
    if (req.method === 'POST') {
      const rol = roles.find(rol => rol.id === body.rolId);
      usuarios.push({ id: 3, nombre: body.nombre, apellido: body.apellido, correo: body.correo, rol_id: rol.id, rol: rol.nombre, activo: true });
    } else if (req.method === 'PUT') {
      const rol = roles.find(rol => rol.id === body.rolId);
      Object.assign(usuarios.find(usuario => usuario.id === id), { nombre: body.nombre, apellido: body.apellido, correo: body.correo, rol_id: rol.id, rol: rol.nombre });
    } else if (req.method === 'PATCH') usuarios.find(usuario => usuario.id === id).activo = body.activo;
    return enviar(200, { ok: true, mensaje: 'Estado actualizado' });
  }
  enviar(404, { mensaje: 'No encontrado' });
});

let vite, chrome, socket;
const raizTemporal = resolve(tmpdir());
const perfil = mkdtempSync(join(raizTemporal, 'autoventas-browser-'));
try {
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  vite = await crearVite({
    root: fileURLToPath(new URL('../', import.meta.url)),
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(`http://127.0.0.1:${api.address().port}/api`) },
    server: { host: '127.0.0.1', port: 0 },
  });
  await vite.listen();
  const url = `http://127.0.0.1:${vite.httpServer.address().port}`;
  chrome = spawn(navegador, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const puerto = await new Promise((resolve, reject) => {
    let salida = '';
    const timer = setTimeout(() => reject(new Error('Chrome no inició a tiempo')), 15000);
    chrome.stderr.on('data', fragmento => {
      salida += fragmento;
      const coincidencia = salida.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (coincidencia) { clearTimeout(timer); resolve(coincidencia[1]); }
    });
    chrome.once('error', error => { clearTimeout(timer); reject(error); });
  });
  const pagina = await (await fetch(`http://127.0.0.1:${puerto}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  socket = new WebSocket(pagina.webSocketDebuggerUrl);
  await once(socket, 'open');
  let id = 0;
  const pendientes = new Map();
  socket.addEventListener('message', evento => {
    const mensaje = JSON.parse(evento.data);
    if (!mensaje.id) return;
    const pendiente = pendientes.get(mensaje.id);
    if (!pendiente) return;
    pendientes.delete(mensaje.id);
    clearTimeout(pendiente.timer);
    if (mensaje.error) pendiente.reject(new Error(mensaje.error.message));
    else pendiente.resolve(mensaje.result);
  });
  function comando(method, params = {}) {
    return new Promise((resolve, reject) => {
      const actual = ++id;
      const timer = setTimeout(() => { pendientes.delete(actual); reject(new Error(`Timeout: ${method}`)); }, 10000);
      pendientes.set(actual, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: actual, method, params }));
    });
  }
  async function evaluar(expression) {
    const resultado = await comando('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (resultado.exceptionDetails) throw new Error(resultado.exceptionDetails.text);
    return resultado.result.value;
  }
  async function esperar(expression) {
    const limite = Date.now() + 10000;
    while (Date.now() < limite) {
      if (await evaluar(`Boolean(${expression})`)) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`No se cumplió: ${expression}`);
  }
  const campo = (nombre, valor) => evaluar(`(() => { const input = document.querySelector('[name="${nombre}"]'); const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(valor)}); input.dispatchEvent(new Event('input', {bubbles:true})); input.dispatchEvent(new Event('change', {bubbles:true})); })()`);
  const pulsarTexto = texto => evaluar(`Array.from(document.querySelectorAll('button')).find(boton => boton.textContent.includes(${JSON.stringify(texto)})).click()`);

  await esperar("document.querySelector('input[name=correo]')");
  await campo('correo', 'admin@example.com');
  await campo('password', 'incorrecta');
  await evaluar("document.querySelector('form').requestSubmit()");
  await esperar("document.body.textContent.includes('Credenciales incorrectas')");
  await campo('password', 'Inactivo123');
  await evaluar("document.querySelector('form').requestSubmit()");
  await esperar("document.body.textContent.includes('Usuario inactivo')");
  await campo('password', 'Prueba123');
  await evaluar("document.querySelector('form').requestSubmit()");
  await esperar("document.querySelector('h1')?.textContent === 'Hola, Admin'");
  await esperar("document.body.textContent.includes('No disponible')");
  assert.equal(await evaluar("document.querySelector('.crm-metrica strong').textContent"), '2');
  console.log('OK: errores de login, inicio de sesión y Dashboard con datos reales de la API de prueba');

  await evaluar("location.hash='/usuarios'");
  await esperar("document.querySelectorAll('.crm-tabla tbody tr').length === 2");
  await pulsarTexto('Nuevo usuario');
  await esperar("document.querySelector('dialog[open]')");
  for (const [nombre, valor] of Object.entries({ nombre: 'Persona', apellido: 'Nueva', correo: 'nueva@example.com', rolId: '2', password: 'Prueba123' })) await campo(nombre, valor);
  await evaluar("document.querySelector('dialog form').requestSubmit()");
  await esperar("document.querySelectorAll('.crm-tabla tbody tr').length === 3 && !document.querySelector('dialog')");
  await evaluar("document.querySelectorAll('.crm-tabla tbody tr')[2].querySelector('button').click()");
  await esperar("document.querySelector('dialog[open]')");
  assert.equal(await evaluar("document.querySelector('[name=password]').value"), '');
  await campo('apellido', 'Editada');
  await evaluar("document.querySelector('dialog form').requestSubmit()");
  await esperar("document.body.textContent.includes('Persona Editada') && !document.querySelector('dialog')");
  assert.equal(escrituras.find(escritura => escritura.method === 'PUT').body.password, '');
  await evaluar("window.confirm = () => true; document.querySelectorAll('.crm-tabla tbody tr')[2].querySelectorAll('button')[1].click()");
  await esperar("document.querySelectorAll('.crm-tabla tbody tr')[2].textContent.includes('Inactivo')");
  console.log('OK: listar, crear, editar sin cambiar contraseña y desactivar usuario');

  await comando('Page.reload');
  await esperar("document.querySelector('h1')?.textContent === 'Gestión de Usuarios'");
  await pulsarTexto('Cerrar sesión');
  await esperar("document.querySelector('input[name=correo]')");
  assert.equal(await evaluar("sessionStorage.getItem('autoventas.sesion')"), null);
  await campo('correo', 'vendedor@example.com');
  await campo('password', 'Prueba123');
  await evaluar("document.querySelector('form').requestSubmit()");
  await esperar("document.querySelector('h1')?.textContent === 'Hola, Vendedor'");
  assert.equal(await evaluar("Boolean(document.querySelector('nav a[href=\"#/usuarios\"]'))"), false);
  await evaluar("location.hash='/usuarios'");
  await esperar("document.querySelector('h1')?.textContent === 'Acceso restringido'");
  await comando('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluar("document.documentElement.scrollWidth <= 390"), true);
  await pulsarTexto('☰');
  assert.equal(await evaluar("getComputedStyle(document.querySelector('.crm-sidebar')).display"), 'flex');
  console.log('OK: sesión tras recarga, cierre, permisos visuales y menú móvil sin desbordamiento');
} finally {
  socket?.close();
  if (chrome && chrome.exitCode === null) {
    chrome.kill();
    await once(chrome, 'exit').catch(() => {});
  }
  await vite?.close();
  await new Promise(resolve => api.close(resolve));
  // El único borrado recursivo es el perfil temporal creado por esta prueba.
  if (dirname(resolve(perfil)) === raizTemporal && basename(perfil).startsWith('autoventas-browser-')) {
    rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}
