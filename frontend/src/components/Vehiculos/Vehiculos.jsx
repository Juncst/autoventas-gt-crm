import { useEffect, useState } from 'react';
import { solicitar } from '../../services/api'; 

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [autoSeleccionado, setAutoSeleccionado] = useState(null);

  useEffect(() => {
    async function cargarVehiculos() {
      try {
        const datos = await solicitar('/vehiculos'); 
        setVehiculos(datos);
      } catch (error) {
        console.error("Error al cargar vehículos:", error);
      } finally {
        setCargando(false);
      }
    }
    cargarVehiculos();
  }, []);

  if (cargando) return <div className="p-10 text-center text-gray-500">Cargando inventario...</div>;

  const obtenerFoto = (marca) => {
    const fotos = {
      'Toyota': 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
      'Honda': 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=800',
      'Mazda': 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&q=80&w=800',
      'Hyundai': 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&q=80&w=800'
    };
    return fotos[marca] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800';
  };

  const fotoRescate = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";

  // FUNCIÓN PARA GUARDAR LA COTIZACIÓN Y REDIRIGIR
  const irACotizar = async (auto) => {
    try {
      // 1. Armamos el objeto con los datos requeridos por el backend
      const nuevaCotizacion = {
        codigo: `COT-${Math.floor(Math.random() * 100000)}`, // Código aleatorio para el MVP
        cliente_id: 1, // Cliente de prueba (recuerda que debe existir en la BD)
        vehiculo_id: auto.id,
        asesor: "Carlos Mendoza",
        monto: auto.precio,
        observaciones: `Cotización generada desde el catálogo para el ${auto.marca} ${auto.modelo}`
      };

      // 2. Hacemos el POST a la base de datos
      // CORRECCIÓN: Pasamos el objeto directamente. Tu api.js ya hace el stringify y los headers.
      await solicitar('/cotizaciones', {
        method: 'POST',
        body: nuevaCotizacion 
      });

      // 3. Si todo sale bien, cerramos el modal (si está abierto) y redirigimos
      setAutoSeleccionado(null);
      window.location.hash = '#/cotizaciones';
      
    } catch (error) {
      console.error("Error al generar cotización:", error);
      alert("Hubo un error al guardar la cotización en el servidor.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Vehículos</h1>
          <p className="text-gray-500 text-sm">Control de flota disponible, reservada y vendida</p>
        </div>
        <button className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
          <span>+</span> Registrar Vehículo
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <input type="text" placeholder="🔍 Buscar por Marca, Modelo, VIN o Placa" className="flex-1 min-w-[300px] bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex gap-2">
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"><option>Todas las Marcas</option></select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"><option>Todos los Estados</option></select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehiculos.map((auto) => (
          <div key={auto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col">
            <div className="relative h-48 bg-gray-200">
              <img 
                src={obtenerFoto(auto.marca)} 
                alt={`${auto.marca} ${auto.modelo}`} 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = fotoRescate; }}
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">{auto.estado}</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">{auto.condicion}</span>
              </div>
              <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md">{auto.anio}</div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{auto.tipo} • {auto.marca}</p>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{auto.marca} {auto.modelo}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Precio</p>
                  <p className="text-lg font-bold text-blue-900">Q{Number(auto.precio).toLocaleString('es-GT')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg mb-4 text-center mt-auto">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Motor</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{auto.motor}</p>
                </div>
                <div className="border-l border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Kilometraje</p>
                  <p className="text-xs font-semibold text-gray-800">{auto.kilometraje} km</p>
                </div>
                <div className="border-l border-gray-200">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Transmisión</p>
                  <p className="text-xs font-semibold text-gray-800 truncate">{auto.transmision}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button onClick={() => setAutoSeleccionado(auto)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Ver Ficha</button>
                
                <button onClick={() => irACotizar(auto)} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-medium transition">
                  Cotizar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {autoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setAutoSeleccionado(null)} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-600 z-10">✕</button>
            <div className="md:w-1/2 h-64 md:h-auto bg-gray-100">
              <img src={obtenerFoto(autoSeleccionado.marca)} onError={(e) => { e.target.src = fotoRescate; }} alt={autoSeleccionado.modelo} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 md:w-1/2 flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{autoSeleccionado.marca} {autoSeleccionado.modelo}</h2>
              <p className="text-blue-900 font-bold text-xl mb-4">Q{Number(autoSeleccionado.precio).toLocaleString('es-GT')}</p>
              <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-600 mb-6">
                <p><strong className="text-gray-900">Código:</strong> {autoSeleccionado.codigo}</p>
                <p><strong className="text-gray-900">Año:</strong> {autoSeleccionado.anio}</p>
                <p><strong className="text-gray-900">Color:</strong> {autoSeleccionado.color}</p>
                <p><strong className="text-gray-900">VIN:</strong> {autoSeleccionado.vin}</p>
                <p><strong className="text-gray-900">Combustible:</strong> {autoSeleccionado.combustible}</p>
                <p><strong className="text-gray-900">Kilometraje:</strong> {autoSeleccionado.kilometraje} km</p>
              </div>
              
              <button onClick={() => irACotizar(autoSeleccionado)} className="mt-auto w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg font-bold transition">
                Proceder a Cotizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}