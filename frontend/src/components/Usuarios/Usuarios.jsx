import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { obtenerUsuarios, obtenerRoles, crearUsuario, actualizarUsuario, cambiarEstadoUsuario } from '../../services/usuariosApi';
import FormularioUsuario from './FormularioUsuario';

export default function Usuarios() {
  const { usuario: usuarioActual, actualizarSesion } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState('');
  const [estado, setEstado] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [cambiando, setCambiando] = useState(null);
  const cargar = useCallback((signal) => {
    return Promise.all([obtenerUsuarios(signal), obtenerRoles(signal)]).then(([lista, catalogo]) => {
      if (signal?.aborted) return;
      setUsuarios(lista.usuarios);
      setRoles(catalogo.roles);
      setError('');
    }).catch(async error => {
      if (error.name === 'AbortError') return;
      setError(error.message);
      if (error.status === 403) await actualizarSesion();
    }).finally(() => { if (!signal?.aborted) setCargando(false); });
  }, [actualizarSesion]);
  useEffect(() => {
    const controller = new AbortController();
    cargar(controller.signal);
    return () => controller.abort();
  }, [cargar]);
  async function guardar(datos) {
    if (formulario.usuario) await actualizarUsuario(formulario.usuario.id, datos);
    else await crearUsuario(datos);
    const editandoSesion = formulario.usuario?.id === usuarioActual.id;
    setFormulario(null);
    setMensaje(formulario.usuario ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
    if (editandoSesion) await actualizarSesion();
    await cargar();
  }
  async function cambiarEstado(usuario) {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Deseas ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) return;
    setCambiando(usuario.id);
    setError('');
    setMensaje('');
    try { const respuesta = await cambiarEstadoUsuario(usuario.id, !usuario.activo); setMensaje(respuesta.mensaje); await cargar(); }
    catch (error) { setError(error.message); }
    finally { setCambiando(null); }
  }
  const filtrados = usuarios.filter(usuario => {
    const texto = `${usuario.nombre} ${usuario.apellido} ${usuario.correo}`.toLowerCase();
    return texto.includes(busqueda.trim().toLowerCase()) &&
      (!rol || String(usuario.rol_id) === rol) &&
      (!estado || String(usuario.activo) === estado);
  });
  return (
    <section className="crm-pagina">
      <div className="crm-pagina-encabezado">
        <div>
          <span className="crm-eyebrow">ADMINISTRACIÓN</span>
          <h1>Gestión de Usuarios</h1>
          <p>Administra el acceso y los permisos de tu equipo.</p>
        </div>
        <button
          className="crm-boton"
          disabled={cargando || !roles.length || cambiando !== null}
          onClick={() => { setMensaje(''); setFormulario({ usuario: null }); }}
        >+ Nuevo usuario</button>
      </div>
      {error && <div className="crm-error" role="alert">{error} <button type="button" onClick={() => cargar()}>Reintentar</button></div>}
      {mensaje && <p className="crm-exito" role="status">{mensaje}</p>}
      <div className="crm-filtros">
        <label className="crm-busqueda">
          <span className="crm-solo-lectores">Buscar usuarios</span>
          <input placeholder="Buscar por nombre o correo…" value={busqueda} onChange={e => setBusqueda(e.target.value)} type="search" />
        </label>
        <label>
          <span className="crm-solo-lectores">Filtrar por rol</span>
          <select value={rol} onChange={e => setRol(e.target.value)}>
            <option value="">Todos los roles</option>
            {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
          </select>
        </label>
        <label>
          <span className="crm-solo-lectores">Filtrar por estado</span>
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </label>
      </div>
      <div className="crm-tarjeta">
        <div className="crm-tabla-scroll">
          <table className="crm-tabla">
            <thead><tr>
              <th scope="col">Usuario</th><th scope="col">Correo electrónico</th>
              <th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Acciones</th>
            </tr></thead>
            <tbody>
              {filtrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>
                    <strong>{usuario.nombre} {usuario.apellido}</strong>
                    {usuario.id === usuarioActual.id && <small className="crm-tu">Tu cuenta</small>}
                  </td>
                  <td>{usuario.correo}</td>
                  <td><span className="crm-etiqueta">{usuario.rol}</span></td>
                  <td><span className={`crm-estado ${usuario.activo ? 'crm-estado-activo' : ''}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="crm-tabla-acciones">
                      <button
                        className="crm-enlace" disabled={cambiando !== null || !roles.length}
                        onClick={() => setFormulario({ usuario })}
                        aria-label={`Editar a ${usuario.nombre} ${usuario.apellido}`}
                      >Editar</button>
                      <button
                        className="crm-enlace" disabled={cambiando !== null || usuario.id === usuarioActual.id}
                        title={usuario.id === usuarioActual.id ? 'No puedes desactivar tu propia cuenta' : undefined}
                        onClick={() => cambiarEstado(usuario)}
                        aria-label={`${usuario.activo ? 'Desactivar' : 'Activar'} a ${usuario.nombre} ${usuario.apellido}`}
                      >{cambiando === usuario.id ? 'Guardando…' : usuario.activo ? 'Desactivar' : 'Activar'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtrados.length && (
                <tr><td colSpan="5" className="crm-vacio">
                  {cargando ? 'Cargando usuarios…' : error ? 'No se pudo cargar la lista de usuarios.' : 'No se encontraron usuarios.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="crm-tabla-pie">Mostrando {filtrados.length} de {usuarios.length} usuarios</div>
      </div>
      {formulario && <FormularioUsuario usuario={formulario.usuario} roles={roles} alGuardar={guardar} alCerrar={() => setFormulario(null)} />}
    </section>
  );
}
