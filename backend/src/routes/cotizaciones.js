const express = require("express");
const pool = require("../db");

const router = express.Router();

const ESTADOS_VALIDOS = ["Borrador", "Enviada", "Aceptada", "Rechazada", "Vencida"];

// Las fechas se devuelven como texto YYYY-MM-DD para evitar que la zona
// horaria cambie el día al convertirlas a JSON.
const SELECT_COTIZACION = `
  SELECT
    c.id,
    c.codigo,
    c.cliente_id,
    c.vehiculo_id,
    c.asesor,
    c.monto,
    c.estado,
    to_char(c.fecha, 'YYYY-MM-DD') AS fecha,
    to_char(c.validez, 'YYYY-MM-DD') AS validez,
    c.observaciones,
    cl.nombre AS cliente_nombre,
    cl.nit AS cliente_nit,
    cl.telefono AS cliente_telefono,
    cl.correo AS cliente_correo,
    v.marca AS vehiculo_marca,
    v.modelo AS vehiculo_modelo,
    v.anio AS vehiculo_anio,
    v.combustible AS vehiculo_combustible,
    v.transmision AS vehiculo_transmision,
    v.color AS vehiculo_color
  FROM public.cotizaciones c
  INNER JOIN public.clientes cl ON c.cliente_id = cl.id
  INNER JOIN public.vehiculos v ON c.vehiculo_id = v.id
`;

const texto = (valor) =>
  valor === undefined || valor === null ? "" : String(valor).trim();

const idValido = (valor) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 && n <= 2147483647;
};

// Acepta solo fechas reales con formato YYYY-MM-DD
function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

// Devuelve { error } o { datos }
function validarCotizacion(body, esEdicion) {
  const codigo = texto(body.codigo);
  const asesor = texto(body.asesor);

  if (!codigo) return { error: "El código de la cotización es obligatorio" };
  if (codigo.length > 50) return { error: "El código no puede superar 50 caracteres" };

  if (!idValido(body.cliente_id)) {
    return { error: "Debe indicar un cliente válido (cliente_id)" };
  }
  if (!idValido(body.vehiculo_id)) {
    return { error: "Debe indicar un vehículo válido (vehiculo_id)" };
  }

  if (!asesor) return { error: "El asesor es obligatorio" };
  if (asesor.length > 100) return { error: "El asesor no puede superar 100 caracteres" };

  const monto = Number(body.monto);
  if (texto(body.monto) === "" || !Number.isFinite(monto) || monto < 0 || monto > 9999999999.99) {
    return { error: "El monto debe ser un número válido mayor o igual a 0" };
  }

  // En edición, si no se envía estado se conserva el actual
  const estadoEnviado = texto(body.estado);
  if (estadoEnviado && !ESTADOS_VALIDOS.includes(estadoEnviado)) {
    return { error: `El estado debe ser: ${ESTADOS_VALIDOS.join(", ")}` };
  }
  const estado = estadoEnviado || (esEdicion ? null : "Borrador");

  const fecha = texto(body.fecha) || null;
  const validez = texto(body.validez) || null;

  if (fecha && !fechaValida(fecha)) {
    return { error: "La fecha debe tener el formato AAAA-MM-DD" };
  }
  if (validez && !fechaValida(validez)) {
    return { error: "La validez debe tener el formato AAAA-MM-DD" };
  }
  if (fecha && validez && validez < fecha) {
    return { error: "La validez no puede ser anterior a la fecha de la cotización" };
  }

  return {
    datos: {
      codigo,
      cliente_id: Number(body.cliente_id),
      vehiculo_id: Number(body.vehiculo_id),
      asesor,
      monto,
      estado,
      fecha,
      validez,
      observaciones: texto(body.observaciones) || null,
    },
  };
}

// Traduce los errores de clave foránea a un mensaje comprensible
function mensajeReferencia(error) {
  if (error.constraint && error.constraint.includes("cliente")) {
    return "El cliente indicado no existe";
  }
  if (error.constraint && error.constraint.includes("vehiculo")) {
    return "El vehículo indicado no existe";
  }
  return "El cliente o el vehículo indicado no existe";
}

async function obtenerPorId(id) {
  const resultado = await pool.query(`${SELECT_COTIZACION} WHERE c.id = $1`, [id]);
  return resultado.rows[0];
}

// Obtener todas las cotizaciones (con datos del cliente y del vehículo)
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`${SELECT_COTIZACION} ORDER BY c.id DESC`);

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener cotizaciones:", error.message);
    res.status(500).json({ mensaje: "Error al obtener cotizaciones" });
  }
});

// Registrar una cotización nueva
router.post("/", async (req, res) => {
  try {
    const { error, datos } = validarCotizacion(req.body, false);

    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const insertada = await pool.query(
      `INSERT INTO public.cotizaciones
       (codigo, cliente_id, vehiculo_id, asesor, monto, estado,
        fecha, validez, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6,
               COALESCE($7::date, CURRENT_DATE),
               COALESCE($8::date, COALESCE($7::date, CURRENT_DATE) + 15),
               $9)
       RETURNING id`,
      [
        datos.codigo,
        datos.cliente_id,
        datos.vehiculo_id,
        datos.asesor,
        datos.monto,
        datos.estado,
        datos.fecha,
        datos.validez,
        datos.observaciones,
      ]
    );

    const cotizacion = await obtenerPorId(insertada.rows[0].id);

    res.status(201).json(cotizacion);
  } catch (error) {
    console.error("Error al registrar cotización:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({ mensaje: "Ya existe una cotización con ese código" });
    }

    if (error.code === "23503") {
      return res.status(400).json({ mensaje: mensajeReferencia(error) });
    }

    res.status(500).json({ mensaje: "Error al registrar cotización" });
  }
});

// Editar los datos de una cotización
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!idValido(id)) {
      return res.status(400).json({ mensaje: "Identificador de cotización inválido" });
    }

    const { error, datos } = validarCotizacion(req.body, true);

    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const actualizada = await pool.query(
      `UPDATE public.cotizaciones
       SET codigo = $1,
           cliente_id = $2,
           vehiculo_id = $3,
           asesor = $4,
           monto = $5,
           estado = COALESCE($6::varchar, estado),
           fecha = COALESCE($7::date, fecha),
           validez = COALESCE($8::date, validez),
           observaciones = $9
       WHERE id = $10
       RETURNING id`,
      [
        datos.codigo,
        datos.cliente_id,
        datos.vehiculo_id,
        datos.asesor,
        datos.monto,
        datos.estado,
        datos.fecha,
        datos.validez,
        datos.observaciones,
        id,
      ]
    );

    if (actualizada.rows.length === 0) {
      return res.status(404).json({ mensaje: "Cotización no encontrada" });
    }

    const cotizacion = await obtenerPorId(actualizada.rows[0].id);

    res.json(cotizacion);
  } catch (error) {
    console.error("Error al editar cotización:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({ mensaje: "Ya existe una cotización con ese código" });
    }

    if (error.code === "23503") {
      return res.status(400).json({ mensaje: mensajeReferencia(error) });
    }

    res.status(500).json({ mensaje: "Error al editar cotización" });
  }
});

// Eliminar una cotización
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!idValido(id)) {
      return res.status(400).json({ mensaje: "Identificador de cotización inválido" });
    }

    const resultado = await pool.query(
      "DELETE FROM public.cotizaciones WHERE id = $1 RETURNING id",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Cotización no encontrada" });
    }

    res.json({ mensaje: "Cotización eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cotización:", error.message);
    res.status(500).json({ mensaje: "Error al eliminar cotización" });
  }
});

module.exports = router;