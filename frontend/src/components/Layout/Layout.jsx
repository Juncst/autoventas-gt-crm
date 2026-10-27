import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import Icono from './Icono';

const modulos = [
  { id: 'dashboard', nombre: 'Dashboard' },
  { id: 'clientes', nombre: 'Clientes' },
  { id: 'prospectos', nombre: 'Prospectos' },
  { id: 'vehiculos', nombre: 'Vehículos' },
  { id: 'usuarios', nombre: 'Usuarios', rol: 'ADMINISTRADOR' },
];

export default function Layout({ pantalla, children }) {
  const { usuario, cerrarSesion, errorSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  return (
    <div className="crm-layout">
      <aside className={`crm-sidebar ${menuAbierto ? 'crm-sidebar-abierto' : ''}`}>
        <a className="crm-marca" href="#/dashboard" onClick={() => setMenuAbierto(false)}>
          <span className="crm-logo"><Icono nombre="auto" /></span>
          <span>AutoVentas <b>GT</b><small>GESTIÓN COMERCIAL</small></span>
        </a>
        <p className="crm-nav-titulo">PRINCIPAL</p>
        <nav aria-label="Navegación principal">
          {modulos.filter(modulo => !modulo.rol || modulo.rol === usuario.rol).map(modulo => (
            <a
              key={modulo.id}
              href={`#/${modulo.id}`}
              className={pantalla === modulo.id ? 'crm-nav-activo' : ''}
              aria-current={pantalla === modulo.id ? 'page' : undefined}
              onClick={() => setMenuAbierto(false)}
            >
              <Icono nombre={modulo.id} />{modulo.nombre}
            </a>
          ))}
        </nav>
        <div className="crm-sidebar-pie">
          <span className="crm-avatar">{usuario.nombre.slice(0, 1)}{usuario.apellido.slice(0, 1)}</span>
          <div><strong>{usuario.nombre} {usuario.apellido}</strong><small>{usuario.rol}</small></div>
        </div>
        <button className="crm-salir" onClick={cerrarSesion}><Icono nombre="salir" />Cerrar sesión</button>
      </aside>
      <div className="crm-area">
        <header className="crm-header">
          <button className="crm-menu" aria-expanded={menuAbierto} aria-label="Abrir o cerrar menú" onClick={() => setMenuAbierto(!menuAbierto)}>☰</button>
          <span>
            <span className="crm-header-concepto">Espacio de trabajo</span> <span className="crm-header-separador">/</span>
            <strong>{modulos.find(modulo => modulo.id === pantalla)?.nombre || 'Cotizaciones'}</strong>
          </span>
          <div className="crm-header-usuario">
            <span className="crm-avatar" aria-hidden="true">{usuario.nombre.slice(0, 1)}{usuario.apellido.slice(0, 1)}</span>
            <div><strong>{usuario.nombre} {usuario.apellido}</strong><small>{usuario.rol}</small></div>
          </div>
        </header>
        {errorSesion && <p className="crm-aviso" role="status">No se pudo actualizar la sesión: {errorSesion}</p>}
        <main id="contenido-principal">{children}</main>
      </div>
    </div>
  );
}