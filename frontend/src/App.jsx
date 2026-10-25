
import { useSyncExternalStore } from "react";
import Clientes from "./components/Clientes/Clientes";
import Prospectos from "./components/Prospectos/Prospectos";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import Login from "./components/Login/Login";
import Layout from "./components/Layout/Layout";
import Usuarios from "./components/Usuarios/Usuarios";
import Dashboard from "./components/Dashboard/Dashboard";
import "./App.css";

function suscribir(callback) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

function Aplicacion() {
  const { usuario, comprobando, errorSesion, actualizarSesion, cerrarSesion } = useAuth();
  const ruta = useSyncExternalStore(suscribir, () => window.location.hash.slice(2));
  if (comprobando) {
    return (
      <div className="crm-espera">
        <h1>AutoVentas GT</h1>
        {errorSesion ? (
          <>
            <p className="crm-error" role="alert">{errorSesion}</p>
            <button className="crm-boton" onClick={() => actualizarSesion()}>Reintentar</button>
            <button className="crm-boton-secundario" onClick={cerrarSesion}>Volver al login</button>
          </>
        ) : <p role="status">Verificando sesión…</p>}
      </div>
    );
  }
  if (!usuario) return <Login />;
  const pantalla = ['clientes', 'prospectos', 'usuarios'].includes(ruta) ? ruta : 'dashboard';
  let contenido = <Dashboard />;
  if (pantalla === 'clientes') contenido = <Clientes />;
  if (pantalla === 'prospectos') contenido = <Prospectos />;
  if (pantalla === 'usuarios') {
    contenido = usuario.rol === 'ADMINISTRADOR' ? <Usuarios /> : (
      <section className="crm-pagina">
        <h1>Acceso restringido</h1>
        <p>La administración de usuarios está disponible únicamente para ADMINISTRADOR.</p>
        <a href="#/dashboard">Volver al Dashboard</a>
      </section>
    );
  }
  return <Layout pantalla={pantalla}>{contenido}</Layout>;
}

export default function App() {
  return <AuthProvider><Aplicacion /></AuthProvider>;
}
