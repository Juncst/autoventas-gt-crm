const CLAVE = 'autoventas.sesion';

export function leerSesion() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem(CLAVE));
    return typeof sesion?.token === 'string' && sesion.usuario ? sesion : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  if (sesion) sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  else sessionStorage.removeItem(CLAVE);
}

// El vencimiento solo sirve para cerrar la UI a tiempo. El servidor valida el JWT.
export function vencimientoToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return Number.isFinite(exp) ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}
