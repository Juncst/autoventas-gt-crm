import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import Icono from '../Layout/Icono';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(evento) {
    evento.preventDefault();
    if (cargando) return;
    if (!correo.trim() || !password) { setError('Ingresa tu correo y contraseña'); return; }
    setCargando(true);
    setError('');
    try { await iniciarSesion(correo.trim(), password); }
    catch (error) { setError(error.message); }
    finally { setCargando(false); }
  }

  return (
    <div className="crm-login">
      <section className="crm-login-presentacion">
        <div className="crm-marca"><span className="crm-logo"><Icono nombre="auto" /></span><span>AutoVentas <b>GT</b><small>GESTIÓN COMERCIAL</small></span></div>
        <div><span className="crm-eyebrow">TU EQUIPO. TUS OPORTUNIDADES.</span><h1>Todo tu proceso comercial,<br />en un solo lugar.</h1><p>Conecta con tus clientes, da seguimiento a cada oportunidad y organiza el trabajo de tu equipo.</p><div className="crm-login-modulos"><span>Clientes</span><span>Prospectos</span><span>Equipo</span></div></div>
        <small>AutoVentas GT · Guatemala</small>
      </section>
      <section className="crm-login-formulario">
        <form className="crm-form crm-login-tarjeta" onSubmit={enviar}>
          <span className="crm-login-icono"><Icono nombre="auto" width="32" height="32" /></span>
          <h2>Bienvenido de nuevo</h2><p>Ingresa tus credenciales para acceder al CRM.</p>
          {error && <div className="crm-error" role="alert">{error}</div>}
          <label>Correo electrónico<input autoFocus type="email" name="correo" autoComplete="username" maxLength={150} value={correo} onChange={e => setCorreo(e.target.value)} placeholder="tu.correo@empresa.com" required disabled={cargando} /></label>
          <label>Contraseña<div className="crm-password"><input type={visible ? 'text' : 'password'} name="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required disabled={cargando} /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button></div></label>
          <button className="crm-boton crm-boton-ancho" disabled={cargando}>{cargando ? 'Iniciando sesión…' : 'Iniciar sesión →'}</button>
          <small className="crm-login-ayuda">Si necesitas acceso o recuperar tu contraseña, contacta al administrador.</small>
        </form>
      </section>
    </div>
  );
}
