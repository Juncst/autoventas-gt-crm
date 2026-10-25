import { solicitar } from './api';

export const obtenerUsuarios = (signal) => solicitar('/usuarios', { signal });
export const obtenerRoles = (signal) => solicitar('/roles', { signal });
export const crearUsuario = (body) => solicitar('/usuarios', { method: 'POST', body });
export const actualizarUsuario = (id, body) => solicitar(`/usuarios/${id}`, { method: 'PUT', body });
export const cambiarEstadoUsuario = (id, activo) => solicitar(`/usuarios/${id}/estado`, { method: 'PATCH', body: { activo } });
