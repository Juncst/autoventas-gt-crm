import { useEffect, useState } from 'react';
import { solicitar } from '../../services/api';

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const datos = await solicitar('/cotizaciones');
        setCotizaciones(datos);
        if (datos.length > 0) setSeleccionada(datos[0]);
      } catch (error) {
        console.error("Error al cargar cotizaciones:", error);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) return <div className="p-10 text-center text-gray-500">Cargando cotizaciones...</div>;

  // Cálculos reales para las tarjetas de arriba
  const totalMonto = cotizaciones.reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  const aceptadas = cotizaciones.filter(c => c.estado === 'Aceptada').length;
  const enNegociacion = cotizaciones.filter(c => c.estado !== 'Aceptada' && c.estado !== 'Vendida').length;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs text-slate-500 mb-1">Inicio &gt; Cotizaciones</p>
          <h1 className="text-2xl font-bold text-slate-900">Cotizaciones de Venta</h1>
          <p className="text-slate-500 text-sm">Administración y seguimiento de propuestas económicas a clientes</p>
        </div>
        <button className="bg-[#0f172a] hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition shadow-sm">
          <span>+</span> Nueva Cotización
        </button>
      </div>

      {/* Tarjetas de Resumen (KPIs dinámicos) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Cotizaciones</p>
            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-slate-900">{cotizaciones.length}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">Registradas en el sistema</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monto Cotizado</p>
            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
          </div>
          <div className="flex items-end gap-2">
            {/* AQUÍ ESTÁ EL CAMBIO: Ahora es dinámico */}
            <p className="text-2xl font-bold text-slate-900">Q {totalMonto.toLocaleString('es-GT')}</p>
            <span className="text-xs text-slate-500 font-medium mb-1">GTQ</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Valor en inventario propuesto</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Aceptadas</p>
            <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
          </div>
          <div className="flex items-end gap-2">
            {/* AQUÍ ESTÁ EL CAMBIO */}
            <p className="text-3xl font-bold text-slate-900">{aceptadas}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">Listas para cierre o facturar</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">En Negociación</p>
            <div className="bg-amber-50 text-amber-600 p-1.5 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
          </div>
          <div className="flex items-end gap-2">
            {/* AQUÍ ESTÁ EL CAMBIO */}
            <p className="text-3xl font-bold text-slate-900">{enNegociacion}</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">Llamadas y pruebas de manejo</p>
        </div>
      </div>

      {/* Tabla de Cotizaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <th className="p-4 font-bold">Número</th>
              <th className="p-4 font-bold">Cliente</th>
              <th className="p-4 font-bold">Vehículo</th>
              <th className="p-4 font-bold">Asesor</th>
              <th className="p-4 font-bold">Total (Q)</th>
              <th className="p-4 font-bold">Estado</th>
              <th className="p-4 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {cotizaciones.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  No hay cotizaciones registradas. Ve a la sección de Vehículos para generar una.
                </td>
              </tr>
            ) : (
              cotizaciones.map((cot) => (
                <tr 
                  key={cot.id} 
                  onClick={() => setSeleccionada(cot)}
                  className={`cursor-pointer transition ${seleccionada?.id === cot.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}
                >
                  <td className="p-4 font-medium text-blue-900">{cot.codigo}</td>
                  <td className="p-4 font-bold text-slate-900">Cliente ID: {cot.cliente_id}</td>
                  <td className="p-4 text-slate-600">Vehículo ID: {cot.vehiculo_id}</td>
                  <td className="p-4 text-slate-600">{cot.asesor}</td>
                  <td className="p-4 font-bold text-slate-900">Q {Number(cot.monto).toLocaleString('es-GT')}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {cot.estado || 'Borrador'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-600 px-3 py-1 rounded-lg">Ver Ficha</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ficha Técnica (Se muestra al hacer clic en una fila) - Diseño Stitch */}
      {seleccionada && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ficha Técnica de Cotización #{seleccionada.codigo}</h2>
                <p className="text-xs text-slate-500">Asesor: {seleccionada.asesor}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Descargar PDF</button>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm">Convertir a Venta</button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">👤 Información del Cliente</h3>
              <p className="text-sm text-slate-600"><strong className="text-slate-900">ID:</strong> {seleccionada.cliente_id}</p>
              <p className="text-sm text-slate-600 mt-1"><strong className="text-slate-900">Observaciones:</strong> {seleccionada.observaciones || 'Ninguna'}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">🚗 Vehículo Cotizado</h3>
              <p className="text-sm text-slate-600"><strong className="text-slate-900">ID:</strong> {seleccionada.vehiculo_id}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3">💰 Desglose Económico (GTQ)</h3>
              <div className="flex justify-between text-sm text-slate-600"><span>Precio Base:</span> <span>Q {Number(seleccionada.monto).toLocaleString('es-GT')}</span></div>
              <div className="flex justify-between text-sm text-slate-600 mt-1"><span>Descuento:</span> <span>Q 0</span></div>
              <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Neto:</span> 
                <span className="text-blue-900">Q {Number(seleccionada.monto).toLocaleString('es-GT')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}