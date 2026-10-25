
const API_URL = "http://localhost:3000/api/prospectos";

// Revisamos si el servidor respondió correctamente
async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje || "Ocurrió un error al comunicarse con el servidor"
    );
  }

  return datos;
}

// Consultar todos los prospectos
export async function obtenerProspectos() {
  const respuesta = await fetch(API_URL);
  return procesarRespuesta(respuesta);
}

// Registrar un prospecto
export async function crearProspecto(datos) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(respuesta);
}

// Editar un prospecto
export async function actualizarProspecto(id, datos) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(respuesta);
}

// Eliminar un prospecto
export async function eliminarProspectoApi(id) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return procesarRespuesta(respuesta);
}

// Consultar las notas de un prospecto
export async function obtenerNotas(id) {
  const respuesta = await fetch(`${API_URL}/${id}/notas`);
  return procesarRespuesta(respuesta);
}

// Guardar una nota
export async function crearNota(id, contenido) {
  const respuesta = await fetch(`${API_URL}/${id}/notas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contenido }),
  });

  return procesarRespuesta(respuesta);
}

// Consultar el historial de actividades
export async function obtenerActividades(id) {
  const respuesta = await fetch(`${API_URL}/${id}/actividades`);
  return procesarRespuesta(respuesta);
}

// Registrar una actividad de seguimiento
export async function crearActividad(id, datos) {
  const respuesta = await fetch(`${API_URL}/${id}/actividades`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  return procesarRespuesta(respuesta);
}
