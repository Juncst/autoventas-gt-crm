import { leerSesion } from './sesion.js';

const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export async function solicitar(ruta, { body, token = leerSesion()?.token, ...opciones } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Comprueba que el backend esté disponible.', { cause: error });
  }
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('sesion-expirada', { detail: token }));
    }
    const error = new Error(datos?.mensaje || datos?.message || 'No se pudo completar la solicitud');
    error.status = respuesta.status;
    throw error;
  }
  if (datos === null) throw new Error('El servidor no devolvió una respuesta JSON válida');
  return datos;
}
