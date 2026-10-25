import { useEffect, useRef, useState } from 'react';

export default function FormularioUsuario({ usuario, roles, alGuardar, alCerrar }) {
  const dialogo = useRef(null);
  const [formulario, setFormulario] = useState({ nombre: usuario?.nombre || '', apellido: usuario?.apellido || '', correo: usuario?.correo || '', rolId: usuario?.rol_id || '', password: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const modal = dialogo.current;
    modal.showModal();
    return () => modal.close();
  }, []);
  function cambiar(evento) {
    setFormulario(anterior => ({ ...anterior, [evento.target.name]: evento.target.value }));
  }
  async function enviar(evento) {
    evento.preventDefault();
    if (guardando) return;
    if (![formulario.nombre, formulario.apellido, formulario.correo].every(valor => valor.trim())) { setError('Completa todos los campos obligatorios'); return; }
    if (formulario.password && new TextEncoder().encode(formulario.password).length > 72) { setError('La contraseña debe ocupar como máximo 72 bytes'); return; }
    setGuardando(true);
    setError('');
    try { await alGuardar({ ...formulario, rolId: Number(formulario.rolId) }); }
    catch (error) { setError(error.message); setGuardando(false); }
  }
  return (
    <dialog ref={dialogo} className="crm-modal" aria-labelledby="titulo-usuario" onCancel={evento => { evento.preventDefault(); if (!guardando) alCerrar(); }}>
      <div className="crm-modal-encabezado"><div><h2 id="titulo-usuario">{usuario ? 'Editar usuario' : 'Nuevo usuario'}</h2><p>Datos de acceso y permisos del equipo.</p></div><button type="button" className="crm-icono-boton" aria-label="Cerrar formulario" disabled={guardando} onClick={alCerrar}>×</button></div>
      <form className="crm-form" onSubmit={enviar}>
        {error && <p className="crm-error" role="alert">{error}</p>}
        <fieldset disabled={guardando} className="crm-form-grid">
          <label>Nombre *<input autoFocus name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={cambiar} maxLength={100} required /></label>
          <label>Apellido *<input name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={cambiar} maxLength={100} required /></label>
          <label className="crm-campo-completo">Correo electrónico *<input name="correo" type="email" autoComplete="off" value={formulario.correo} onChange={cambiar} maxLength={150} required /></label>
          <label className="crm-campo-completo">Rol *<select name="rolId" value={formulario.rolId} onChange={cambiar} required><option value="" disabled>Selecciona un rol</option>{roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}</select></label>
          <label className="crm-campo-completo">{usuario ? 'Nueva contraseña (opcional)' : 'Contraseña *'}<input name="password" type="password" autoComplete="new-password" value={formulario.password} onChange={cambiar} minLength={8} required={!usuario} aria-describedby="ayuda-password" /><small id="ayuda-password">{usuario ? 'Déjala vacía para conservar la contraseña actual. ' : ''}Mínimo 8 caracteres; máximo 72 bytes.</small></label>
        </fieldset>
        <div className="crm-form-acciones"><button type="button" className="crm-boton-secundario" onClick={alCerrar} disabled={guardando}>Cancelar</button><button className="crm-boton" disabled={guardando}>{guardando ? 'Guardando…' : usuario ? 'Guardar cambios' : 'Crear usuario'}</button></div>
      </form>
    </dialog>
  );
}
