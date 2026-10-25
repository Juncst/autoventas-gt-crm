import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { solicitar } from '../services/api';
import { guardarSesion, leerSesion, vencimientoToken } from '../services/sesion';

export default function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);
  const [verificada, setVerificada] = useState(false);
  const [errorSesion, setErrorSesion] = useState('');

  const cerrarSesion = useCallback(() => {
    guardarSesion(null);
    setSesion(null);
    setVerificada(false);
    setErrorSesion('');
    window.location.hash = '/login';
  }, []);

  const actualizarSesion = useCallback((signal) => {
    const actual = leerSesion();
    if (!actual) return;
    return solicitar('/auth/me', { token: actual.token, signal }).then(({ usuario }) => {
      // Una respuesta anterior no debe restaurar una sesión cerrada.
      if (leerSesion()?.token !== actual.token) return;
      const nueva = { token: actual.token, usuario };
      guardarSesion(nueva);
      setSesion(nueva);
      setVerificada(true);
      setErrorSesion('');
    }).catch(error => {
      if (error.name === 'AbortError' || leerSesion()?.token !== actual.token) return;
      if (error.status === 401) cerrarSesion();
      else setErrorSesion(error.message);
    });
  }, [cerrarSesion]);

  useEffect(() => {
    const controller = new AbortController();
    actualizarSesion(controller.signal);
    const alEnfocar = () => { actualizarSesion(); };
    const alExpirar = (evento) => {
      if (leerSesion()?.token === evento.detail) cerrarSesion();
    };
    window.addEventListener('focus', alEnfocar);
    window.addEventListener('sesion-expirada', alExpirar);
    return () => {
      controller.abort();
      window.removeEventListener('focus', alEnfocar);
      window.removeEventListener('sesion-expirada', alExpirar);
    };
  }, [actualizarSesion, cerrarSesion]);

  useEffect(() => {
    if (!sesion) return;
    const espera = Math.max(0, vencimientoToken(sesion.token) - Date.now());
    const timer = window.setTimeout(cerrarSesion, Math.min(espera, 2147483647));
    return () => window.clearTimeout(timer);
  }, [sesion, cerrarSesion]);

  async function iniciarSesion(correo, password) {
    const { token, usuario } = await solicitar('/auth/login', {
      method: 'POST', body: { correo, password }, token: null,
    });
    const nueva = { token, usuario };
    guardarSesion(nueva);
    setSesion(nueva);
    setVerificada(true);
    setErrorSesion('');
    window.location.hash = '/dashboard';
  }

  return (
    <AuthContext.Provider value={{
      usuario: verificada ? sesion?.usuario : null,
      comprobando: Boolean(sesion) && !verificada,
      errorSesion, iniciarSesion, cerrarSesion, actualizarSesion,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
