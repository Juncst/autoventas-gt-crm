
import { useEffect, useState } from "react";
import "./Prospectos.css";
import { solicitar } from "../../services/api";
import { useAuth } from "../../context/useAuth";

import {
  obtenerProspectos,
  crearProspecto,
  actualizarProspecto,
  eliminarProspectoApi,
  obtenerNotas,
  crearNota,
  obtenerActividades,
  crearActividad,
} from "../../services/prospectosApi";

// Los prospectos se cargan desde PostgreSQL
function adaptarProspecto(registro) {
  return {
    ...registro,
    detalleVehiculo: registro.detalle_vehiculo || "Vehículo de interés",
    precio: Number(registro.precio || 0),
    fecha: registro.fecha_registro
      ? new Date(registro.fecha_registro).toLocaleDateString("es-GT")
      : "",
    fechaCierre: registro.fecha_cierre || null,
    actividades: registro.actividades || [],
    notas: registro.notas || [],
  };
}

function adaptarFecha(fecha) {
  if (!fecha) return "";
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? String(fecha)
    : valor.toLocaleString("es-GT");
}

const estadosDisponibles = [
  "Nuevo",
  "Contactado",
  "Seguimiento",
  "Cotización",
  "Negociación",
  "Ganado",
  "Perdido",
];

const formularioVacio = {
  nombre: "",
  descripcion: "",
  telefono: "",
  correo: "",
  vehiculo: "",
  asesor: "",
  estado: "Nuevo",
  observaciones: "",
};

const etapasComerciales = [
  "Nuevo",
  "Contactado",
  "Seguimiento",
  "Cotización",
  "Negociación",
  "Ganado",
];

function esEstadoCerrado(estado) {
  return estado === "Ganado" || estado === "Perdido";
}

// Íconos de las acciones
function Icono({ tipo, size = 18 }) {
  const propiedades = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (tipo === "ver") {
    return (
      <svg {...propiedades}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (tipo === "editar") {
    return (
      <svg {...propiedades}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
      </svg>
    );
  }

  if (tipo === "eliminar") {
    return (
      <svg {...propiedades}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M5 6l1 15h12l1-15" />
        <path d="M10 10v7M14 10v7" />
      </svg>
    );
  }

  return null;
}

function Prospectos() {
  const { usuario } = useAuth();
  const [prospectos, setProspectos] = useState([]);
  const [vehiculosCatalogo, setVehiculosCatalogo] = useState([]);
  const [cotizacionesRegistradas, setCotizacionesRegistradas] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarProspectos() {
      try {
        const registros = await obtenerProspectos();

        if (activo) {
          setProspectos(registros.map(adaptarProspecto));
        }

        const [vehiculos, cotizaciones] = await Promise.all([
          solicitar("/vehiculos").catch(() => []),
          solicitar("/cotizaciones").catch(() => []),
        ]);

        if (activo) {
          setVehiculosCatalogo(vehiculos);
          setCotizacionesRegistradas(cotizaciones);
        }
      } catch (error) {
        console.error("Error al cargar prospectos:", error);

        if (activo) {
          alert(
            "No se pudieron cargar los prospectos. Revisa que el backend esté encendido."
          );
        }
      }
    }

    cargarProspectos();

    return () => {
      activo = false;
    };
  }, []);

  async function recargarProspectos() {
    const registros = await obtenerProspectos();

    setProspectos((anteriores) =>
      registros.map((registro) => {
        const previo = anteriores.find(
          (item) => item.id === registro.id
        );

        return {
          ...adaptarProspecto(registro),
          notas: previo?.notas || [],
          actividades: previo?.actividades || [],
        };
      })
    );
  }

  async function cargarSeguimiento(id) {
    try {
      const [notas, actividades] = await Promise.all([
        obtenerNotas(id),
        obtenerActividades(id),
      ]);

      setProspectos((anteriores) =>
        anteriores.map((item) =>
          item.id === id
            ? {
                ...item,
                notas: notas.map((nota) => ({
                  ...nota,
                  texto: nota.texto ?? nota.contenido,
                  fecha: adaptarFecha(nota.fecha),
                })),
                actividades: actividades.map((actividad) => ({
                  ...actividad,
                  fecha: adaptarFecha(actividad.fecha),
                })),
              }
            : item
        )
      );
    } catch (error) {
      console.error("Error al cargar seguimiento:", error);
      alert(
        "No se pudieron cargar las notas y actividades del prospecto."
      );
    }
  }

  const nombreUsuario = usuario
    ? `${usuario.nombre} ${usuario.apellido}`.trim()
    : "";

  const asesoresDisponibles = Array.from(
    new Set(
      [...prospectos.map((item) => item.asesor), nombreUsuario]
        .filter(Boolean)
    )
  ).sort();

  const vehiculosDisponibles = Array.from(
    new Set([
      ...vehiculosCatalogo.map(
        (auto) => `${auto.marca} ${auto.modelo} ${auto.anio}`
      ),
      ...prospectos.map((item) => item.vehiculo).filter(Boolean),
    ])
  ).sort();

  const imagenesVehiculos = Object.fromEntries(
    vehiculosCatalogo
      .filter((auto) => auto.imagen_url)
      .map((auto) => [
        `${auto.marca} ${auto.modelo} ${auto.anio}`,
        auto.imagen_url,
      ])
  );

  const [busqueda, setBusqueda] = useState("");
  const [asesor, setAsesor] = useState("");
  const [estado, setEstado] = useState("");
  const [vehiculo, setVehiculo] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [nuevoProspecto, setNuevoProspecto] = useState({
    ...formularioVacio,
  });

  const [prospectoEditando, setProspectoEditando] = useState(null);

  const [prospectoSeleccionadoId, setProspectoSeleccionadoId] =
    useState(null);

  const [notaNueva, setNotaNueva] = useState("");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const prospectoSeleccionado = prospectos.find(
    (prospecto) => prospecto.id === prospectoSeleccionadoId
  );

  // Indicadores del módulo
  const totalActivos = prospectos.filter(
    (prospecto) => !esEstadoCerrado(prospecto.estado)
  ).length;

  const enNegociacion = prospectos.filter(
    (prospecto) => prospecto.estado === "Negociación"
  );

  const totalNegociacion = enNegociacion.length;

  const valorNegociacion = enNegociacion.reduce(
    (total, prospecto) =>
      total + Number(prospecto.precio || 0),
    0
  );

  const ahora = new Date();

  const cierresDelMes = prospectos.filter((prospecto) => {
    if (
      !esEstadoCerrado(prospecto.estado) ||
      !prospecto.fechaCierre
    ) {
      return false;
    }

    const fecha = new Date(prospecto.fechaCierre);

    return (
      !Number.isNaN(fecha.getTime()) &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  });

  const ganadosDelMes = cierresDelMes.filter(
    (prospecto) => prospecto.estado === "Ganado"
  ).length;

  const tasaCierre =
    cierresDelMes.length > 0
      ? (ganadosDelMes / cierresDelMes.length) * 100
      : null;

  // Filtros para buscar prospectos
  const prospectosFiltrados = prospectos.filter((prospecto) => {
    const texto = busqueda.toLowerCase().trim();

    const coincideBusqueda = [
      prospecto.nombre,
      prospecto.telefono,
      prospecto.correo,
      prospecto.vehiculo,
    ].some((valor) =>
      String(valor || "").toLowerCase().includes(texto)
    );

    return (
      coincideBusqueda &&
      (!asesor || prospecto.asesor === asesor) &&
      (!estado || prospecto.estado === estado) &&
      (!vehiculo || prospecto.vehiculo === vehiculo)
    );
  });

  function limpiarFiltros() {
    setBusqueda("");
    setAsesor("");
    setEstado("");
    setVehiculo("");
  }

  function obtenerIniciales(nombre) {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((palabra) => palabra[0])
      .join("")
      .toUpperCase();
  }

  function claseEstado(estadoActual) {
    return `prospectos-estado estado-${estadoActual
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")}`;
  }

  function abrirNuevoProspecto() {
    setProspectoEditando(null);
    setNuevoProspecto({
      ...formularioVacio,
      asesor: nombreUsuario || asesoresDisponibles[0] || "",
    });
    setMostrarFormulario(true);
  }

  function editarProspecto(prospecto) {
    setProspectoEditando(prospecto.id);

    setNuevoProspecto({
      ...formularioVacio,
      ...prospecto,
    });

    setMostrarFormulario(true);
  }

  function cambiarDato(e) {
    const { name, value } = e.target;

    if (name === "vehiculo") {
      const auto = vehiculosCatalogo.find(
        (item) => `${item.marca} ${item.modelo} ${item.anio}` === value
      );

      setNuevoProspecto((anterior) => ({
        ...anterior,
        vehiculo: value,
        detalleVehiculo: auto
          ? `${auto.tipo} · ${auto.transmision} · ${auto.combustible}`
          : anterior.detalleVehiculo,
        precio: auto ? Number(auto.precio || 0) : anterior.precio,
      }));
      return;
    }

    setNuevoProspecto((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setProspectoEditando(null);
    setNuevoProspecto({ ...formularioVacio });
  }

  function verDetalle(prospecto) {
    setProspectoSeleccionadoId(prospecto.id);
    setNotaNueva("");
    setMostrarHistorial(false);
    cargarSeguimiento(prospecto.id);
  }

  // Eliminamos un prospecto de PostgreSQL
  async function eliminarProspecto(prospecto) {
    const confirmar = window.confirm(
      `¿Estás segura de que deseas eliminar a ${prospecto.nombre}?`
    );

    if (!confirmar) return;

    try {
      await eliminarProspectoApi(prospecto.id);

      setProspectos((anteriores) =>
        anteriores.filter((item) => item.id !== prospecto.id)
      );

      if (prospectoSeleccionadoId === prospecto.id) {
        setProspectoSeleccionadoId(null);
      }
    } catch (error) {
      console.error("Error al eliminar prospecto:", error);
      alert("No se pudo eliminar el prospecto.");
    }
  }

  // Registramos o editamos un prospecto en PostgreSQL
  async function guardarProspecto(e) {
    e.preventDefault();

    if (guardando) return;

    const nombre = nuevoProspecto.nombre.trim();
    const telefono = nuevoProspecto.telefono.trim();
    const correo = nuevoProspecto.correo.trim();

    if (!nombre || !telefono || !correo || !nuevoProspecto.vehiculo) {
      alert("Completa los campos obligatorios.");
      return;
    }

    const datosGuardados = {
      ...nuevoProspecto,
      nombre,
      telefono,
      correo,
      detalleVehiculo:
        nuevoProspecto.detalleVehiculo || "Vehículo de interés",
      precio: Number(nuevoProspecto.precio || 0),
    };

    setGuardando(true);

    try {
      if (prospectoEditando !== null) {
        const anterior = prospectos.find(
          (item) => item.id === prospectoEditando
        );

        const estadoCambio =
          anterior && anterior.estado !== datosGuardados.estado;

        await actualizarProspecto(
          prospectoEditando,
          datosGuardados
        );

        if (estadoCambio) {
          await crearActividad(prospectoEditando, {
            tipo: "Estado",
            titulo: `Cambio de etapa a ${datosGuardados.estado}`,
            descripcion:
              "Se actualizó el estado del prospecto desde el formulario.",
          });
        }

        await recargarProspectos();

        if (estadoCambio && prospectoSeleccionadoId === prospectoEditando) {
          await cargarSeguimiento(prospectoEditando);
        }
      } else {
        const registro = await crearProspecto({
          ...datosGuardados,
          codigo: `PRS-${Date.now()}`,
        });

        await recargarProspectos();

        if (registro?.id) {
          setProspectoSeleccionadoId(registro.id);
          await cargarSeguimiento(registro.id);
        }
      }

      limpiarFiltros();
      cerrarFormulario();
    } catch (error) {
      console.error("Error al guardar prospecto:", error);
      alert(
        "No se pudo completar la operación. Revisa la conexión con el servidor."
      );
    } finally {
      setGuardando(false);
    }
  }

  // Guardamos las notas y registramos la actividad
  async function guardarNota() {
    const texto = notaNueva.trim();

    if (!texto || !prospectoSeleccionado) {
      alert("Escribe una nota antes de guardarla.");
      return;
    }

    if (guardando) return;

    setGuardando(true);

    try {
      await crearNota(prospectoSeleccionado.id, texto);

      await crearActividad(prospectoSeleccionado.id, {
        tipo: "Nota",
        titulo: "Nota agregada por el asesor",
        descripcion: texto,
      });

      setNotaNueva("");
      await cargarSeguimiento(prospectoSeleccionado.id);
    } catch (error) {
      console.error("Error al guardar nota:", error);
      alert(
        "No se pudo completar el registro de la nota y su actividad."
      );
    } finally {
      setGuardando(false);
    }
  }

  // Avanzamos a la siguiente etapa del proceso comercial
  async function avanzarEtapa() {
    if (!prospectoSeleccionado || guardando) return;

    const posicion = etapasComerciales.indexOf(
      prospectoSeleccionado.estado
    );

    if (
      posicion === -1 ||
      posicion === etapasComerciales.length - 1
    ) {
      alert("Este prospecto no tiene otra etapa para avanzar.");
      return;
    }

    const siguienteEstado = etapasComerciales[posicion + 1];
    const id = prospectoSeleccionado.id;

    setGuardando(true);

    try {
      await actualizarProspecto(id, {
        ...prospectoSeleccionado,
        estado: siguienteEstado,
      });

      await crearActividad(id, {
        tipo: "Estado",
        titulo: `Cambio de etapa a ${siguienteEstado}`,
        descripcion:
          "Se actualizó la etapa del prospecto en el proceso comercial.",
      });

      await recargarProspectos();
      await cargarSeguimiento(id);
    } catch (error) {
      console.error("Error al avanzar etapa:", error);
      alert("No se pudo completar el cambio de etapa.");
    } finally {
      setGuardando(false);
    }
  }

  function crearCotizacion() {
    window.location.hash = "#/vehiculos";
  }

  function formatoQuetzales(cantidad) {
    return `Q ${Number(cantidad || 0).toLocaleString("es-GT")}`;
  }
  return (
    <div className="prospectos-contenedor">
      {/* Encabezado */}
      <div className="prospectos-encabezado">
        <div>
          <h1>Gestión de Prospectos</h1>
          <p>
            Seguimiento y conversión del embudo comercial automotriz
          </p>
        </div>

        <button
          type="button"
          className="prospectos-boton"
          onClick={abrirNuevoProspecto}
        >
          + Nuevo Prospecto
        </button>
      </div>

      {/* Indicadores */}
      <div className="prospectos-indicadores">
        <div className="prospectos-indicador">
          <span>Total Activos</span>
          <div className="prospectos-indicador-datos">
            <strong>{totalActivos}</strong>
            <small className="prospectos-indicador-azul">
              En proceso
            </small>
          </div>
        </div>

        <div className="prospectos-indicador">
          <span>En Negociación</span>
          <div className="prospectos-indicador-datos">
            <strong>{totalNegociacion}</strong>
            <small className="prospectos-indicador-naranja">
              {formatoQuetzales(valorNegociacion)}
            </small>
          </div>
        </div>

        <div className="prospectos-indicador">
          <span>Cotizaciones Emitidas</span>
          <div className="prospectos-indicador-datos">
            <strong>{cotizacionesRegistradas.length}</strong>
            <small className="prospectos-indicador-morado">
              Registradas en sistema
            </small>
          </div>
        </div>

        <div className="prospectos-indicador">
          <span>Tasa Cierre Mes</span>
          <div className="prospectos-indicador-datos">
            <strong>
              {tasaCierre === null
                ? "—"
                : `${tasaCierre.toFixed(1)}%`}
            </strong>
            <small className="prospectos-indicador-verde">
              {cierresDelMes.length} cerrados
            </small>
          </div>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="prospectos-filtros">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono, vehículo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={asesor}
          onChange={(e) => setAsesor(e.target.value)}
        >
          <option value="">Todos los asesores</option>
          {asesoresDisponibles.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estadosDisponibles.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>

        <select
          value={vehiculo}
          onChange={(e) => setVehiculo(e.target.value)}
        >
          <option value="">Vehículo de interés (Todos)</option>
          {vehiculosDisponibles.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="prospectos-limpiar"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>
      </div>

      {/* Tabla de prospectos */}
      <div className="prospectos-tabla-contenedor">
        <table className="prospectos-tabla">
          <thead>
            <tr>
              <th>Nombre del Prospecto</th>
              <th>Teléfono / Correo</th>
              <th>Vehículo de Interés</th>
              <th>Asesor Asignado</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {prospectosFiltrados.map((prospecto) => (
              <tr key={prospecto.id}>
                <td>
                  <div className="prospectos-persona">
                    <div className="prospectos-avatar">
                      {obtenerIniciales(prospecto.nombre)}
                    </div>

                    <div>
                      <div className="prospectos-nombre">
                        {prospecto.nombre}
                      </div>
                      <small>{prospecto.descripcion}</small>
                    </div>
                  </div>
                </td>

                <td>
                  <div>{prospecto.telefono}</div>
                  <small>{prospecto.correo}</small>
                </td>

                <td>
                  <div className="prospectos-vehiculo">
                    {prospecto.vehiculo}
                  </div>
                  <small>{prospecto.detalleVehiculo}</small>
                </td>

                <td>{prospecto.asesor}</td>
                <td>{prospecto.fecha}</td>

                <td>
                  <span className={claseEstado(prospecto.estado)}>
                    {prospecto.estado}
                  </span>
                </td>

                <td>
                  <div className="prospectos-acciones">
                    <button
                      type="button"
                      title="Ver detalle"
                      aria-label={`Ver detalle de ${prospecto.nombre}`}
                      onClick={() => verDetalle(prospecto)}
                    >
                      <Icono tipo="ver" />
                    </button>

                    <button
                      type="button"
                      title="Editar"
                      aria-label={`Editar ${prospecto.nombre}`}
                      onClick={() => editarProspecto(prospecto)}
                    >
                      <Icono tipo="editar" />
                    </button>

                    <button
                      type="button"
                      title="Eliminar"
                      aria-label={`Eliminar ${prospecto.nombre}`}
                      onClick={() => eliminarProspecto(prospecto)}
                    >
                      <Icono tipo="eliminar" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {prospectosFiltrados.length === 0 && (
          <p className="prospectos-sin-resultados">
            No se encontraron prospectos.
          </p>
        )}

        <div className="prospectos-tabla-pie">
          Mostrando {prospectosFiltrados.length} de{" "}
          {prospectos.length} prospectos
        </div>
      </div>

      {/* Ficha de seguimiento */}
      {prospectoSeleccionado && (
        <section className="prospectos-ficha">
          <div className="prospectos-ficha-encabezado">
            <div className="prospectos-ficha-persona">
              <div className="prospectos-avatar">
                {obtenerIniciales(prospectoSeleccionado.nombre)}
              </div>

              <div>
                <h2>
                  Ficha de Detalle: {prospectoSeleccionado.nombre}
                </h2>

                <div className="prospectos-ficha-meta">
                  <span
                    className={claseEstado(
                      prospectoSeleccionado.estado
                    )}
                  >
                    {prospectoSeleccionado.estado}
                  </span>

                  <span>
                    {prospectoSeleccionado.codigo ||
                      `PRS-${prospectoSeleccionado.id}`}
                  </span>
                  <span>{prospectoSeleccionado.telefono}</span>
                  <span>{prospectoSeleccionado.correo}</span>
                  <span>{prospectoSeleccionado.descripcion}</span>
                  <span>
                    Asesor: {prospectoSeleccionado.asesor}
                  </span>
                </div>
              </div>
            </div>

            <div className="prospectos-ficha-botones">
              <button
                type="button"
                className="prospectos-cancelar"
                onClick={() =>
                  document.getElementById("nota-prospecto")?.focus()
                }
              >
                Añadir Nota
              </button>

              <button
                type="button"
                className="prospectos-boton"
                onClick={crearCotizacion}
              >
                Crear Cotización
              </button>

              <button
                type="button"
                className="prospectos-avanzar"
                onClick={avanzarEtapa}
                disabled={guardando}
              >
                Avanzar Etapa
              </button>
            </div>
          </div>

          <div className="prospectos-ficha-columnas">
            {/* Vehículo de interés */}
            <div className="prospectos-ficha-columna">
              <h3>Vehículo de interés seleccionado</h3>

              <div className="prospectos-ficha-tarjeta">
                <div className="prospectos-vehiculo-imagen">
                  {imagenesVehiculos[
                    prospectoSeleccionado.vehiculo
                  ] ? (
                    <img
                      src={
                        imagenesVehiculos[
                          prospectoSeleccionado.vehiculo
                        ]
                      }
                      alt={prospectoSeleccionado.vehiculo}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "9px",
                      }}
                    />
                  ) : (
                    <span>Imagen no disponible</span>
                  )}
                </div>

                <h4>{prospectoSeleccionado.vehiculo}</h4>
                <p>{prospectoSeleccionado.detalleVehiculo}</p>

                <strong className="prospectos-precio">
                  {prospectoSeleccionado.precio
                    ? formatoQuetzales(
                        prospectoSeleccionado.precio
                      )
                    : "Precio pendiente"}
                </strong>

                <p>Vehículo seleccionado por el prospecto.</p>
              </div>

              <div className="prospectos-ficha-tarjeta">
                <h3>Esquema financiero propuesto</h3>
                <p>
                  Información de financiamiento pendiente de
                  confirmar.
                </p>
                <p>
                  Las condiciones serán registradas en el módulo
                  correspondiente.
                </p>
              </div>
            </div>

            {/* Historial de actividades */}
            <div className="prospectos-ficha-columna">
              <div className="prospectos-seccion-titulo">
                <h3>Historial de actividades</h3>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarHistorial(!mostrarHistorial)
                  }
                >
                  {mostrarHistorial
                    ? "Mostrar menos"
                    : "Ver historial completo"}
                </button>
              </div>

              <div className="prospectos-actividades">
                {(mostrarHistorial
                  ? prospectoSeleccionado.actividades || []
                  : (prospectoSeleccionado.actividades || []).slice(
                      0,
                      3
                    )
                ).map((actividad) => (
                  <div
                    className="prospectos-actividad"
                    key={actividad.id}
                  >
                    <div className="prospectos-actividad-punto" />

                    <div className="prospectos-actividad-contenido">
                      <div className="prospectos-actividad-cabecera">
                        <strong>{actividad.titulo}</strong>
                        <small>{actividad.fecha}</small>
                      </div>

                      <p>{actividad.descripcion}</p>
                      <small>{actividad.tipo}</small>
                    </div>
                  </div>
                ))}

                {(prospectoSeleccionado.actividades || []).length ===
                  0 && (
                  <p className="prospectos-sin-resultados">
                    Todavía no hay actividades registradas.
                  </p>
                )}
              </div>
            </div>

            {/* Notas y cotizaciones */}
            <div className="prospectos-ficha-columna">
              <h3>Notas rápidas del asesor</h3>

              <div className="prospectos-ficha-tarjeta">
                <textarea
                  id="nota-prospecto"
                  value={notaNueva}
                  onChange={(e) => setNotaNueva(e.target.value)}
                  placeholder="Escribir nota interna sobre el prospecto..."
                  rows="4"
                />

                <button
                  type="button"
                  className="prospectos-boton"
                  onClick={guardarNota}
                  disabled={guardando}
                >
                  Guardar Nota
                </button>

                <div className="prospectos-notas-guardadas">
                  {(prospectoSeleccionado.notas || []).map(
                    (nota) => (
                      <div
                        className="prospectos-nota"
                        key={nota.id}
                      >
                        <p>{nota.texto}</p>
                        <small>{nota.fecha}</small>
                      </div>
                    )
                  )}
                </div>
              </div>

              <h3>Cotizaciones registradas</h3>

              <div className="prospectos-ficha-tarjeta">
                <p>
                  Hay {cotizacionesRegistradas.length} cotizaciones registradas
                  en el sistema. Puedes consultarlas desde el módulo Cotizaciones.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Formulario para registrar y editar */}
      {mostrarFormulario && (
        <div
          className="prospectos-modal-fondo"
          onClick={cerrarFormulario}
        >
          <div
            className="prospectos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-prospecto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prospectos-modal-encabezado">
              <div>
                <h2 id="titulo-formulario-prospecto">
                  {prospectoEditando !== null
                    ? "Editar Prospecto"
                    : "Registrar Nuevo Prospecto"}
                </h2>

                <p>
                  {prospectoEditando !== null
                    ? "Modifica los datos del prospecto."
                    : "Ingresa los datos de la persona interesada en un vehículo."}
                </p>
              </div>

              <button
                type="button"
                className="prospectos-modal-cerrar"
                onClick={cerrarFormulario}
                aria-label="Cerrar formulario"
              >
                ×
              </button>
            </div>

            <form
              className="prospectos-formulario"
              onSubmit={guardarProspecto}
            >
              <label className="campo-completo">
                Nombre Completo *
                <input
                  type="text"
                  name="nombre"
                  value={nuevoProspecto.nombre}
                  onChange={cambiarDato}
                  placeholder="Nombre del prospecto"
                  required
                />
              </label>

              <label>
                Teléfono *
                <input
                  type="tel"
                  name="telefono"
                  value={nuevoProspecto.telefono}
                  onChange={cambiarDato}
                  placeholder="+502 0000-0000"
                  required
                />
              </label>

              <label>
                Correo Electrónico *
                <input
                  type="email"
                  name="correo"
                  value={nuevoProspecto.correo}
                  onChange={cambiarDato}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </label>

              <label className="campo-completo">
                Empresa / Descripción
                <input
                  type="text"
                  name="descripcion"
                  value={nuevoProspecto.descripcion}
                  onChange={cambiarDato}
                  placeholder="Ej. Empresa - Zona 10"
                />
              </label>

              <label className="campo-completo">
                Vehículo de Interés *
                <select
                  name="vehiculo"
                  value={nuevoProspecto.vehiculo}
                  onChange={cambiarDato}
                  required
                >
                  <option value="">Selecciona un vehículo</option>
                  {vehiculosDisponibles.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Asesor Asignado *
                <select
                  name="asesor"
                  value={nuevoProspecto.asesor}
                  onChange={cambiarDato}
                  required
                >
                  {asesoresDisponibles.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Estado *
                <select
                  name="estado"
                  value={nuevoProspecto.estado}
                  onChange={cambiarDato}
                  required
                >
                  {estadosDisponibles.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo-completo">
                Observaciones
                <textarea
                  name="observaciones"
                  value={nuevoProspecto.observaciones}
                  onChange={cambiarDato}
                  placeholder="Información adicional del prospecto..."
                  rows="3"
                />
              </label>

              <div className="prospectos-formulario-acciones">
                <button
                  type="button"
                  className="prospectos-cancelar"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="prospectos-boton"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : prospectoEditando !== null
                      ? "Guardar Cambios"
                      : "Guardar Prospecto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Prospectos;
