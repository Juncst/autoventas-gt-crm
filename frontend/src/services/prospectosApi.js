import { solicitar } from "./api";

export function obtenerProspectos() {
  return solicitar("/prospectos");
}

export function crearProspecto(datos) {
  return solicitar("/prospectos", {
    method: "POST",
    body: datos,
  });
}

export function actualizarProspecto(id, datos) {
  return solicitar(`/prospectos/${id}`, {
    method: "PUT",
    body: datos,
  });
}

export function eliminarProspectoApi(id) {
  return solicitar(`/prospectos/${id}`, {
    method: "DELETE",
  });
}

export function obtenerNotas(id) {
  return solicitar(`/prospectos/${id}/notas`);
}

export function crearNota(id, contenido) {
  return solicitar(`/prospectos/${id}/notas`, {
    method: "POST",
    body: { contenido },
  });
}

export function obtenerActividades(id) {
  return solicitar(`/prospectos/${id}/actividades`);
}

export function crearActividad(id, datos) {
  return solicitar(`/prospectos/${id}/actividades`, {
    method: "POST",
    body: datos,
  });
}
