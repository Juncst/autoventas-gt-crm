import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { solicitar } from '../../services/api';
import Icono from '../Layout/Icono';

const recursos = [
  { id: 'clientes', titulo: 'Clientes registrados', descripcion: 'Tu cartera de clientes', icono: 'clientes' },
  { id: 'prospectos', titulo: 'Prospectos registrados', descripcion: 'Oportunidades en seguimiento', icono: 'prospectos' },
  // <-- NUEVOS RECURSOS AÑADIDOS AQUÍ PARA LAS MÉTRICAS -->
  { id: 'vehiculos', titulo: 'Vehículos en catálogo', descripcion: 'Inventario disponible', icono: 'vehiculos' },
  { id: 'cotizaciones', titulo: 'Cotizaciones generadas', descripcion: 'Propuestas comerciales', icono: 'cotizaciones' },
];

export default function Dashboard() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function cargar() {
      const respuestas = await Promise.allSettled(recursos.map(async recurso => {
        const datos = await solicitar(`/${recurso.id}`, { signal: controller.signal });
        if (!Array.isArray(datos)) throw new Error('La respuesta del módulo no tiene el formato esperado');
        return datos;
      }));
      if (!controller.signal.aborted) setResumen(respuestas);
    }
    cargar();
    return () => controller.abort();
  }, [intento]);

  return (
    <section className="crm-pagina">
      <div className="crm-pagina-encabezado">
        <div>
          <span className="crm-eyebrow">RESUMEN GENERAL</span>
          <h1>Hola, {usuario.nombre}</h1>
          <p>Este es el estado de los módulos conectados de AutoVentas GT.</p>
        </div>
        <button className="crm-boton-secundario" disabled={!resumen} onClick={() => { setResumen(null); setIntento(valor => valor + 1); }}>
          Actualizar datos
        </button>
      </div>

      {/* MÉTRICAS (Ahora se generan 4 automáticamente gracias al arreglo modificado) */}
      <div className="crm-metricas">
        {recursos.map((recurso, indice) => {
          const respuesta = resumen?.[indice];
          return (
            <article className="crm-tarjeta crm-metrica" key={recurso.id}>
              <span className="crm-metrica-icono"><Icono nombre={recurso.icono} /></span>
              <p>{recurso.titulo}</p>
              <strong>{!respuesta ? '…' : respuesta.status === 'fulfilled' ? respuesta.value.length : 'No disponible'}</strong>
              <small>{recurso.descripcion}</small>
              {respuesta?.status === 'rejected' && <p className="crm-metrica-error" role="status">{respuesta.reason.message}</p>}
              <a href={`#/${recurso.id}`}>Ver {recurso.id} →</a>
            </article>
          );
        })}
      </div>

      <div className="crm-dashboard-grid">
        <article className="crm-tarjeta crm-bienvenida">
          <span className="crm-eyebrow">TU ESPACIO DE TRABAJO</span>
          <h2>Cada oportunidad empieza con una conversación.</h2>
          <p>Consulta tus clientes, explora el inventario de vehículos y da seguimiento a los prospectos desde el menú principal.</p>
          <a href="#/prospectos" className="crm-boton">Ir a Prospectos →</a>
        </article>

        <article className="crm-tarjeta crm-accesos">
          <h2>Accesos rápidos</h2>
          
          <a href="#/clientes">
            <Icono nombre="clientes" />
            <span>Gestionar clientes<small>Consulta y actualiza tu cartera</small></span>
            <span>→</span>
          </a>
          
          <a href="#/prospectos">
            <Icono nombre="prospectos" />
            <span>Seguimiento de prospectos<small>Organiza tus oportunidades</small></span>
            <span>→</span>
          </a>

          {/* NUEVOS ACCESOS RÁPIDOS */}
          <a href="#/vehiculos">
            <Icono nombre="vehiculos" />
            <span>Catálogo de vehículos<small>Explora el inventario disponible</small></span>
            <span>→</span>
          </a>
          
          <a href="#/cotizaciones">
            <Icono nombre="cotizaciones" />
            <span>Módulo de cotizaciones<small>Genera propuestas comerciales</small></span>
            <span>→</span>
          </a>

          {usuario.rol === 'ADMINISTRADOR' && (
            <a href="#/usuarios">
              <Icono nombre="usuarios" />
              <span>Administrar usuarios<small>Gestiona el acceso del equipo</small></span>
              <span>→</span>
            </a>
          )}
        </article>
      </div>

      {/* ELIMINAMOS LA NOTA QUE DECÍA QUE VEHÍCULOS NO ESTABA DISPONIBLE */}
    </section>
  );
}