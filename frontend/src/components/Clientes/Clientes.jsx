
import { useEffect, useState } from "react";
import "./Clientes.css";

const API_URL = "http://localhost:3000/api/clientes";

const formularioVacio = {
  nombre: "",
  nit: "",
  telefono: "",
  correo: "",
  direccion: "",
  tipo: "Individual",
  asesor: "Sofía Estrada",
  observaciones: "",
  estado: "Activo",
};

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [asesor, setAsesor] = useState("");
  const [estado, setEstado] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(formularioVacio);
  const [clienteEditando, setClienteEditando] = useState(null);

  // Cargamos los clientes guardados en PostgreSQL
  useEffect(() => {
    async function cargarClientes() {
      try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los clientes.");
        }

        const datos = await respuesta.json();
        setClientes(datos);
      } catch (error) {
        setError(error.message);
      } finally {
        setCargando(false);
      }
    }

    cargarClientes();
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase().trim();

    const coincideBusqueda = [
      cliente.nombre,
      cliente.nit,
      cliente.telefono,
      cliente.correo,
    ].some((valor) =>
      String(valor || "").toLowerCase().includes(texto)
    );

    const coincideTipo = !tipo || cliente.tipo === tipo;
    const coincideAsesor = !asesor || cliente.asesor === asesor;
    const coincideEstado = !estado || cliente.estado === estado;

    return (
      coincideBusqueda &&
      coincideTipo &&
      coincideAsesor &&
      coincideEstado
    );
  });

  function limpiarFiltros() {
    setBusqueda("");
    setTipo("");
    setAsesor("");
    setEstado("");
  }

  function abrirNuevoCliente() {
    setClienteEditando(null);
    setNuevoCliente({ ...formularioVacio });
    setMostrarFormulario(true);
  }

  function editarCliente(cliente) {
    setClienteEditando(cliente.id);
    setNuevoCliente({
      ...formularioVacio,
      ...cliente,
      direccion: cliente.direccion || "",
      observaciones: cliente.observaciones || "",
    });
    setMostrarFormulario(true);
  }

  function cambiarDato(e) {
    const { name, value } = e.target;

    setNuevoCliente((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function cerrarFormulario() {
    if (guardando) return;

    setMostrarFormulario(false);
    setClienteEditando(null);
    setNuevoCliente({ ...formularioVacio });
  }

  // Guardamos los cambios directamente en PostgreSQL
  async function guardarCliente(e) {
    e.preventDefault();

    const nombre = nuevoCliente.nombre.trim();
    const nit = nuevoCliente.nit.trim();
    const telefono = nuevoCliente.telefono.trim();
    const correo = nuevoCliente.correo.trim();

    if (!nombre || !nit || !telefono || !correo) {
      alert("Completa los campos obligatorios.");
      return;
    }

    const nitExiste = clientes.some(
      (cliente) =>
        String(cliente.nit || "").toLowerCase() ===
          nit.toLowerCase() &&
        cliente.id !== clienteEditando
    );

    if (nitExiste) {
      alert("Ya existe otro cliente con este NIT.");
      return;
    }

    const datosGuardados = {
      codigo:
        clienteEditando !== null
          ? nuevoCliente.codigo
          : `CLI-${Date.now()}`,
      nombre,
      nit,
      telefono,
      correo,
      direccion: nuevoCliente.direccion,
      tipo: nuevoCliente.tipo,
      asesor: nuevoCliente.asesor,
      observaciones: nuevoCliente.observaciones,
      estado: nuevoCliente.estado,
    };

    const editando = clienteEditando !== null;

    const url = editando
      ? `${API_URL}/${clienteEditando}`
      : API_URL;

    setGuardando(true);

    try {
      const respuesta = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosGuardados),
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo guardar el cliente.");
      }

      const clienteGuardado = await respuesta.json();

      if (editando) {
        setClientes((anteriores) =>
          anteriores.map((cliente) =>
            cliente.id === clienteEditando
              ? clienteGuardado
              : cliente
          )
        );
      } else {
        setClientes((anteriores) => [
          clienteGuardado,
          ...anteriores,
        ]);
      }

      limpiarFiltros();
      setMostrarFormulario(false);
      setClienteEditando(null);
      setNuevoCliente({ ...formularioVacio });
    } catch (error) {
      alert(error.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="clientes-contenedor">
      {/* Encabezado */}
      <div className="clientes-encabezado">
        <div>
          <h1>Gestión de Clientes</h1>
          <p>
            Administra la cartera de clientes individuales y corporativos
          </p>
        </div>

        <button
          type="button"
          className="clientes-boton"
          onClick={abrirNuevoCliente}
        >
          + Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="clientes-filtros">
        <input
          type="text"
          placeholder="Buscar por nombre, NIT, teléfono o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Tipo de Cliente</option>
          <option value="Individual">Individual</option>
          <option value="Empresarial">Empresarial</option>
        </select>

        <select
          value={asesor}
          onChange={(e) => setAsesor(e.target.value)}
        >
          <option value="">Todos los asesores</option>
          <option value="Sofía Estrada">Sofía Estrada</option>
          <option value="Juan Pablo Rivera">Juan Pablo Rivera</option>
          <option value="Mario Morales">Mario Morales</option>
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Estado (Todos)</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>

        <button
          type="button"
          className="clientes-limpiar"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>
      </div>

      {/* Tabla de clientes */}
      <div className="clientes-tabla-contenedor">
        <table className="clientes-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>NIT / Identificación</th>
              <th>Teléfono</th>
              <th>Correo electrónico</th>
              <th>Tipo de cliente</th>
              <th>Vendedor asignado</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.id}>
                <td>
                  <div className="cliente-nombre">
                    {cliente.nombre}
                  </div>
                  <small>{cliente.codigo || cliente.id}</small>
                </td>

                <td>{cliente.nit}</td>
                <td>{cliente.telefono}</td>
                <td>{cliente.correo}</td>

                <td>
                  <span
                    className={
                      cliente.tipo === "Individual"
                        ? "tipo-individual"
                        : "tipo-empresarial"
                    }
                  >
                    {cliente.tipo}
                  </span>
                </td>

                <td>{cliente.asesor}</td>

                <td>
                  <span
                    className={
                      cliente.estado === "Activo"
                        ? "estado-activo"
                        : "estado-inactivo"
                    }
                  >
                    {cliente.estado}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="clientes-editar"
                    onClick={() => editarCliente(cliente)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cargando && (
          <p className="clientes-sin-resultados">
            Cargando clientes...
          </p>
        )}

        {error && (
          <p className="clientes-sin-resultados">
            {error}
          </p>
        )}

        {!cargando &&
          !error &&
          clientesFiltrados.length === 0 && (
            <p className="clientes-sin-resultados">
              No se encontraron clientes.
            </p>
          )}

        <div className="clientes-tabla-pie">
          Mostrando {clientesFiltrados.length} de{" "}
          {clientes.length} clientes
        </div>
      </div>

      {/* Formulario para crear o editar clientes */}
      {mostrarFormulario && (
        <div
          className="clientes-modal-fondo"
          onClick={cerrarFormulario}
        >
          <div
            className="clientes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-cliente"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="clientes-modal-encabezado">
              <div>
                <h2 id="titulo-formulario-cliente">
                  {clienteEditando !== null
                    ? "Editar Cliente"
                    : "Registrar Nuevo Cliente"}
                </h2>
                <p>
                  {clienteEditando !== null
                    ? "Modifica los datos del cliente."
                    : "Ingresa los datos fiscales y de contacto del cliente."}
                </p>
              </div>

              <button
                type="button"
                className="clientes-modal-cerrar"
                onClick={cerrarFormulario}
                aria-label="Cerrar formulario"
                disabled={guardando}
              >
                ×
              </button>
            </div>

            <form
              className="clientes-formulario"
              onSubmit={guardarCliente}
            >
              <label className="campo-completo">
                Nombre Completo o Razón Social *
                <input
                  type="text"
                  name="nombre"
                  value={nuevoCliente.nombre}
                  onChange={cambiarDato}
                  placeholder="Ej. Juan Manuel Castillo Herrera"
                  required
                />
              </label>

              <label>
                NIT Guatemalteco *
                <input
                  type="text"
                  name="nit"
                  value={nuevoCliente.nit}
                  onChange={cambiarDato}
                  placeholder="Ej. 1234567-K o C/F"
                  required
                />
              </label>

              <label>
                Teléfono Principal *
                <input
                  type="tel"
                  name="telefono"
                  value={nuevoCliente.telefono}
                  onChange={cambiarDato}
                  placeholder="+502 0000-0000"
                  required
                />
              </label>

              <label className="campo-completo">
                Correo Electrónico *
                <input
                  type="email"
                  name="correo"
                  value={nuevoCliente.correo}
                  onChange={cambiarDato}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </label>

              <label className="campo-completo">
                Dirección Completa (Guatemala)
                <input
                  type="text"
                  name="direccion"
                  value={nuevoCliente.direccion}
                  onChange={cambiarDato}
                  placeholder="Dirección del cliente"
                />
              </label>

              <label>
                Tipo de Cliente *
                <select
                  name="tipo"
                  value={nuevoCliente.tipo}
                  onChange={cambiarDato}
                  required
                >
                  <option value="Individual">Individual</option>
                  <option value="Empresarial">
                    Empresarial / Flotilla
                  </option>
                </select>
              </label>

              <label>
                Vendedor Asignado *
                <select
                  name="asesor"
                  value={nuevoCliente.asesor}
                  onChange={cambiarDato}
                  required
                >
                  <option value="Sofía Estrada">
                    Sofía Estrada
                  </option>
                  <option value="Juan Pablo Rivera">
                    Juan Pablo Rivera
                  </option>
                  <option value="Mario Morales">
                    Mario Morales
                  </option>
                </select>
              </label>

              <label className="campo-completo">
                Observaciones / Requerimiento Inicial
                <textarea
                  name="observaciones"
                  value={nuevoCliente.observaciones}
                  onChange={cambiarDato}
                  placeholder="Detalles de interés del cliente..."
                  rows="3"
                />
              </label>

              <label>
                Estado del Cliente
                <select
                  name="estado"
                  value={nuevoCliente.estado}
                  onChange={cambiarDato}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </label>

              <div className="clientes-formulario-acciones">
                <button
                  type="button"
                  className="clientes-cancelar"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="clientes-boton"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : clienteEditando !== null
                    ? "Guardar Cambios"
                    : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
