import { useEffect, useState } from 'react';
import { solicitar } from '../../services/api';

function dinero(valor) {
  return `Q ${Number(valor || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);

  async function cargar() {
    setCargando(true);
    setError('');

    try {
      const datos = await solicitar('/cotizaciones');
      setCotizaciones(datos);
      setSeleccionada((actual) => {
        if (!datos.length) return null;
        return datos.find((item) => item.id === actual?.id) || datos[0];
      });
    } catch (e) {
      console.error('Error al cargar cotizaciones:', e);
      setError(e.message || 'No se pudieron cargar las cotizaciones');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const totalMonto = cotizaciones.reduce(
    (total, cotizacion) => total + Number(cotizacion.monto || 0),
    0
  );

  const aceptadas = cotizaciones.filter(
    (cotizacion) => cotizacion.estado === 'Aceptada'
  ).length;

  const pendientes = cotizaciones.filter(
    (cotizacion) => ['Borrador', 'Enviada'].includes(cotizacion.estado)
  ).length;

  if (cargando) {
    return (
      <div className="p-10 text-center text-gray-500">
        Cargando cotizaciones...
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen text-slate-800">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Inicio &gt; Cotizaciones</p>
          <h1 className="text-2xl font-bold text-slate-900">Cotizaciones de Venta</h1>
          <p className="text-slate-500 text-sm">
            Administración y seguimiento de propuestas económicas a clientes
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={cargar}
            className="border border-slate-300 bg-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            Actualizar
          </button>

          <a
            href="#/vehiculos"
            className="bg-[#0f172a] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            + Nueva Cotización
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Total Cotizaciones
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {cotizaciones.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Monto Cotizado
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {dinero(totalMonto)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Aceptadas
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{aceptadas}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Pendientes
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{pendientes}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-bold">Número</th>
              <th className="p-4 font-bold">Cliente</th>
              <th className="p-4 font-bold">Vehículo</th>
              <th className="p-4 font-bold">Asesor</th>
              <th className="p-4 font-bold">Total</th>
              <th className="p-4 font-bold">Estado</th>
              <th className="p-4 font-bold">Fecha</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm">
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  No hay cotizaciones registradas. Puedes crear una desde Vehículos.
                </td>
              </tr>
            ) : (
              cotizaciones.map((cotizacion) => (
                <tr
                  key={cotizacion.id}
                  onClick={() => setSeleccionada(cotizacion)}
                  className={
                    seleccionada?.id === cotizacion.id
                      ? 'cursor-pointer bg-blue-50/60'
                      : 'cursor-pointer hover:bg-slate-50'
                  }
                >
                  <td className="p-4 font-semibold text-blue-900">
                    {cotizacion.codigo}
                  </td>

                  <td className="p-4 font-semibold text-slate-900">
                    {cotizacion.cliente_nombre || `Cliente #${cotizacion.cliente_id}`}
                  </td>

                  <td className="p-4 text-slate-700">
                    {cotizacion.vehiculo_marca || ''}{' '}
                    {cotizacion.vehiculo_modelo || `Vehículo #${cotizacion.vehiculo_id}`}
                    {cotizacion.vehiculo_anio ? ` ${cotizacion.vehiculo_anio}` : ''}
                  </td>

                  <td className="p-4 text-slate-600">{cotizacion.asesor}</td>
                  <td className="p-4 font-bold text-slate-900">
                    {dinero(cotizacion.monto)}
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {cotizacion.estado || 'Borrador'}
                    </span>
                  </td>

                  <td className="p-4 text-slate-600">
                    {cotizacion.fecha || 'Sin fecha'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {seleccionada && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">
              Cotización {seleccionada.codigo}
            </h2>
            <p className="text-xs text-slate-500">
              Asesor: {seleccionada.asesor}
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Información del Cliente
              </h3>

              <p className="text-sm text-slate-700">
                <strong>Nombre:</strong>{' '}
                {seleccionada.cliente_nombre || `Cliente #${seleccionada.cliente_id}`}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>NIT:</strong> {seleccionada.cliente_nit || 'N/D'}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Teléfono:</strong> {seleccionada.cliente_telefono || 'N/D'}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Correo:</strong> {seleccionada.cliente_correo || 'N/D'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Vehículo Cotizado
              </h3>

              <p className="text-sm text-slate-700">
                <strong>Vehículo:</strong>{' '}
                {seleccionada.vehiculo_marca} {seleccionada.vehiculo_modelo}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Año:</strong> {seleccionada.vehiculo_anio || 'N/D'}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Transmisión:</strong>{' '}
                {seleccionada.vehiculo_transmision || 'N/D'}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Color:</strong> {seleccionada.vehiculo_color || 'N/D'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Resumen Económico
              </h3>

              <p className="text-sm text-slate-700">
                <strong>Monto:</strong> {dinero(seleccionada.monto)}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Estado:</strong> {seleccionada.estado}
              </p>

              <p className="text-sm text-slate-700 mt-1">
                <strong>Válida hasta:</strong>{' '}
                {seleccionada.validez || 'Sin fecha'}
              </p>

              <p className="text-sm text-slate-700 mt-3">
                <strong>Observaciones:</strong>{' '}
                {seleccionada.observaciones || 'Sin observaciones'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
