import { useEffect, useMemo, useState } from 'react';
import { solicitar } from '../../services/api';
import { useAuth } from '../../context/useAuth';

const formularioInicial = {
  codigo: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  tipo: '',
  motor: '',
  combustible: '',
  transmision: '',
  color: '',
  vin: '',
  condicion: 'Nuevo',
  kilometraje: 0,
  precio: '',
  estado: 'Disponible',
  imagen_url: '',
};

export default function Vehiculos() {
  const { usuario } = useAuth();

  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [autoSeleccionado, setAutoSeleccionado] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);

  const [autoCotizar, setAutoCotizar] = useState(null);
  const [clienteId, setClienteId] = useState('');

  async function cargarDatos() {
    setCargando(true);
    setError('');

    try {
      const [datosVehiculos, datosClientes] = await Promise.all([
        solicitar('/vehiculos'),
        solicitar('/clientes'),
      ]);

      setVehiculos(datosVehiculos);
      setClientes(datosClientes);
    } catch (e) {
      console.error('Error al cargar vehículos:', e);
      setError(e.message || 'No se pudo cargar el inventario');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const marcas = useMemo(
    () => [...new Set(vehiculos.map((v) => v.marca).filter(Boolean))].sort(),
    [vehiculos]
  );

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return vehiculos.filter((auto) => {
      const coincideTexto =
        !texto ||
        [auto.codigo, auto.marca, auto.modelo, auto.vin, auto.color]
          .some((valor) => String(valor || '').toLowerCase().includes(texto));

      return (
        coincideTexto &&
        (!marcaFiltro || auto.marca === marcaFiltro) &&
        (!estadoFiltro || auto.estado === estadoFiltro)
      );
    });
  }, [vehiculos, busqueda, marcaFiltro, estadoFiltro]);

  function cambiarCampo(e) {
    const { name, value } = e.target;
    setFormulario((anterior) => ({ ...anterior, [name]: value }));
  }

  async function registrarVehiculo(e) {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);

    try {
      await solicitar('/vehiculos', {
        method: 'POST',
        body: {
          ...formulario,
          anio: Number(formulario.anio),
          kilometraje: Number(formulario.kilometraje || 0),
          precio: Number(formulario.precio),
        },
      });

      setMostrarRegistro(false);
      setFormulario(formularioInicial);
      await cargarDatos();
    } catch (e) {
      alert(e.message || 'No se pudo registrar el vehículo');
    } finally {
      setGuardando(false);
    }
  }

  function abrirCotizacion(auto) {
    setAutoCotizar(auto);
    setClienteId('');
    setAutoSeleccionado(null);
  }

  async function crearCotizacion(e) {
    e.preventDefault();

    if (!autoCotizar || !clienteId || guardando) return;

    setGuardando(true);

    try {
      const codigo = `COT-${Date.now()}`;

      await solicitar('/cotizaciones', {
        method: 'POST',
        body: {
          codigo,
          cliente_id: Number(clienteId),
          vehiculo_id: autoCotizar.id,
          asesor: `${usuario.nombre} ${usuario.apellido}`.trim(),
          monto: Number(autoCotizar.precio),
          estado: 'Borrador',
          observaciones: `Cotización generada para ${autoCotizar.marca} ${autoCotizar.modelo}`,
        },
      });

      setAutoCotizar(null);
      setClienteId('');
      window.location.hash = '#/cotizaciones';
    } catch (e) {
      alert(e.message || 'No se pudo crear la cotización');
    } finally {
      setGuardando(false);
    }
  }

  const obtenerFoto = (auto) => {
    if (auto.imagen_url) return auto.imagen_url;

    const fotos = {
      Toyota: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800',
      Honda: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=800',
      Mazda: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&q=80&w=800',
      Hyundai: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&q=80&w=800',
    };

    return fotos[auto.marca] ||
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800';
  };

  if (cargando) {
    return <div className="p-10 text-center text-gray-500">Cargando inventario...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Vehículos</h1>
          <p className="text-gray-500 text-sm">Control de flota disponible, reservada y vendida</p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarRegistro(true)}
          className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Registrar Vehículo
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por marca, modelo, VIN o código"
          className="flex-1 min-w-[250px] bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
        />

        <select
          value={marcaFiltro}
          onChange={(e) => setMarcaFiltro(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todas las marcas</option>
          {marcas.map((marca) => (
            <option key={marca} value={marca}>{marca}</option>
          ))}
        </select>

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="Disponible">Disponible</option>
          <option value="Reservado">Reservado</option>
          <option value="Vendido">Vendido</option>
        </select>
      </div>

      {vehiculosFiltrados.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          No hay vehículos que coincidan con los filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiculosFiltrados.map((auto) => (
            <div key={auto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="relative h-48 bg-gray-200">
                <img
                  src={obtenerFoto(auto)}
                  alt={`${auto.marca} ${auto.modelo}`}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">
                    {auto.estado}
                  </span>
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
                    {auto.condicion}
                  </span>
                </div>

                <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md">
                  {auto.anio}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">
                      {auto.tipo} · {auto.marca}
                    </p>
                    <h2 className="text-lg font-bold text-gray-900">
                      {auto.marca} {auto.modelo}
                    </h2>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">Precio</p>
                    <p className="text-lg font-bold text-blue-900">
                      Q {Number(auto.precio).toLocaleString('es-GT')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg mb-4 text-center">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Motor</p>
                    <p className="text-xs font-semibold">{auto.motor || 'N/D'}</p>
                  </div>
                  <div className="border-l border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase">Kilometraje</p>
                    <p className="text-xs font-semibold">{Number(auto.kilometraje || 0).toLocaleString('es-GT')} km</p>
                  </div>
                  <div className="border-l border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase">Transmisión</p>
                    <p className="text-xs font-semibold">{auto.transmision}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => setAutoSeleccionado(auto)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
                  >
                    Ver Ficha
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirCotizacion(auto)}
                    disabled={auto.estado === 'Vendido'}
                    className="flex-1 bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    Cotizar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {autoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden relative">
            <button
              type="button"
              onClick={() => setAutoSeleccionado(null)}
              className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 shadow"
            >
              ×
            </button>

            <img
              src={obtenerFoto(autoSeleccionado)}
              alt={autoSeleccionado.modelo}
              className="w-full h-64 object-cover"
            />

            <div className="p-6">
              <h2 className="text-2xl font-bold">
                {autoSeleccionado.marca} {autoSeleccionado.modelo}
              </h2>
              <p className="text-blue-900 font-bold text-xl mb-4">
                Q {Number(autoSeleccionado.precio).toLocaleString('es-GT')}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                <p><strong>Código:</strong> {autoSeleccionado.codigo}</p>
                <p><strong>Año:</strong> {autoSeleccionado.anio}</p>
                <p><strong>Color:</strong> {autoSeleccionado.color || 'N/D'}</p>
                <p><strong>VIN:</strong> {autoSeleccionado.vin || 'N/D'}</p>
                <p><strong>Combustible:</strong> {autoSeleccionado.combustible}</p>
                <p><strong>Estado:</strong> {autoSeleccionado.estado}</p>
              </div>

              <button
                type="button"
                onClick={() => abrirCotizacion(autoSeleccionado)}
                disabled={autoSeleccionado.estado === 'Vendido'}
                className="w-full bg-blue-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-bold"
              >
                Proceder a Cotizar
              </button>
            </div>
          </div>
        </div>
      )}

      {autoCotizar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={crearCotizacion} className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900">Crear Cotización</h2>
            <p className="text-sm text-gray-500 mt-1 mb-5">
              {autoCotizar.marca} {autoCotizar.modelo} · Q {Number(autoCotizar.precio).toLocaleString('es-GT')}
            </p>

            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cliente
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.codigo ? `${cliente.codigo} - ` : ''}{cliente.nombre}
                </option>
              ))}
            </select>

            <p className="text-sm text-gray-600 mb-5">
              <strong>Asesor:</strong> {usuario.nombre} {usuario.apellido}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAutoCotizar(null)}
                className="border border-gray-300 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
              >
                {guardando ? 'Guardando...' : 'Crear Cotización'}
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarRegistro && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={registrarVehiculo} className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-6">
            <div className="flex justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold">Registrar Vehículo</h2>
                <p className="text-sm text-gray-500">Ingresa los datos principales del inventario.</p>
              </div>
              <button type="button" onClick={() => setMostrarRegistro(false)}>×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="codigo" value={formulario.codigo} onChange={cambiarCampo} placeholder="Código *" required className="border rounded-lg px-3 py-2" />
              <input name="marca" value={formulario.marca} onChange={cambiarCampo} placeholder="Marca *" required className="border rounded-lg px-3 py-2" />
              <input name="modelo" value={formulario.modelo} onChange={cambiarCampo} placeholder="Modelo *" required className="border rounded-lg px-3 py-2" />
              <input name="anio" type="number" value={formulario.anio} onChange={cambiarCampo} placeholder="Año *" required className="border rounded-lg px-3 py-2" />
              <input name="tipo" value={formulario.tipo} onChange={cambiarCampo} placeholder="Tipo *" required className="border rounded-lg px-3 py-2" />
              <input name="motor" value={formulario.motor} onChange={cambiarCampo} placeholder="Motor" className="border rounded-lg px-3 py-2" />
              <input name="combustible" value={formulario.combustible} onChange={cambiarCampo} placeholder="Combustible *" required className="border rounded-lg px-3 py-2" />
              <input name="transmision" value={formulario.transmision} onChange={cambiarCampo} placeholder="Transmisión *" required className="border rounded-lg px-3 py-2" />
              <input name="color" value={formulario.color} onChange={cambiarCampo} placeholder="Color" className="border rounded-lg px-3 py-2" />
              <input name="vin" value={formulario.vin} onChange={cambiarCampo} placeholder="VIN" className="border rounded-lg px-3 py-2" />
              <select name="condicion" value={formulario.condicion} onChange={cambiarCampo} className="border rounded-lg px-3 py-2">
                <option value="Nuevo">Nuevo</option>
                <option value="Seminuevo">Seminuevo</option>
              </select>
              <input name="kilometraje" type="number" min="0" value={formulario.kilometraje} onChange={cambiarCampo} placeholder="Kilometraje" className="border rounded-lg px-3 py-2" />
              <input name="precio" type="number" min="0" step="0.01" value={formulario.precio} onChange={cambiarCampo} placeholder="Precio *" required className="border rounded-lg px-3 py-2" />
              <select name="estado" value={formulario.estado} onChange={cambiarCampo} className="border rounded-lg px-3 py-2">
                <option value="Disponible">Disponible</option>
                <option value="Reservado">Reservado</option>
                <option value="Vendido">Vendido</option>
              </select>
              <input name="imagen_url" value={formulario.imagen_url} onChange={cambiarCampo} placeholder="URL de imagen (opcional)" className="border rounded-lg px-3 py-2 md:col-span-2" />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setMostrarRegistro(false)} className="border border-gray-300 px-4 py-2 rounded-lg">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="bg-blue-900 text-white px-4 py-2 rounded-lg disabled:bg-gray-400">
                {guardando ? 'Guardando...' : 'Guardar Vehículo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
