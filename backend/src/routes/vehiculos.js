const express = require("express");
const pool = require("../db");

const router = express.Router();

const ESTADOS_VALIDOS = ["Disponible", "Reservado", "Vendido"];
const CONDICIONES_VALIDAS = ["Nuevo", "Seminuevo"];

const texto = (valor) =>
  valor === undefined || valor === null ? "" : String(valor).trim();

// Valida el cuerpo de la petición y devuelve { error } o { datos }
function validarVehiculo(body) {
  const codigo = texto(body.codigo);
  const marca = texto(body.marca);
  const modelo = texto(body.modelo);
  const tipo = texto(body.tipo);
  const combustible = texto(body.combustible);
  const transmision = texto(body.transmision);

  if (!codigo) return { error: "El código del vehículo es obligatorio" };
  if (!marca) return { error: "La marca es obligatoria" };
  if (!modelo) return { error: "El modelo es obligatorio" };
  if (!tipo) return { error: "El tipo de vehículo es obligatorio" };
  if (!combustible) return { error: "El combustible es obligatorio" };
  if (!transmision) return { error: "La transmisión es obligatoria" };

  const anio = Number(body.anio);
  const anioMaximo = new Date().getFullYear() + 1;
  if (texto(body.anio) === "" || !Number.isInteger(anio) || anio < 1886 || anio > anioMaximo) {
    return { error: `El año debe ser un número entero entre 1886 y ${anioMaximo}` };
  }

  const precio = Number(body.precio);
  if (texto(body.precio) === "" || !Number.isFinite(precio) || precio < 0 || precio > 9999999999.99) {
    return { error: "El precio debe ser un número válido mayor o igual a 0" };
  }

  const kilometraje = texto(body.kilometraje) === "" ? 0 : Number(body.kilometraje);
  if (!Number.isInteger(kilometraje) || kilometraje < 0 || kilometraje > 2147483647) {
    return { error: "El kilometraje debe ser un número entero mayor o igual a 0" };
  }

  const estado = texto(body.estado) || "Disponible";
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return { error: `El estado debe ser: ${ESTADOS_VALIDOS.join(", ")}` };
  }

  const condicion = texto(body.condicion) || "Nuevo";
  if (!CONDICIONES_VALIDAS.includes(condicion)) {
    return { error: `La condición debe ser: ${CONDICIONES_VALIDAS.join(", ")}` };
  }

  return {
    datos: {
      codigo,
      marca,
      modelo,
      anio,
      tipo,
      motor: texto(body.motor) || null,
      combustible,
      transmision,
      color: texto(body.color) || null,
      vin: texto(body.vin) || null,
      condicion,
      kilometraje,
      precio,
      estado,
      imagen_url: texto(body.imagen_url) || null,
    },
  };
}

// Mismo orden que las columnas del INSERT/UPDATE
function valoresDe(d) {
  return [
    d.codigo,
    d.marca,
    d.modelo,
    d.anio,
    d.tipo,
    d.motor,
    d.combustible,
    d.transmision,
    d.color,
    d.vin,
    d.condicion,
    d.kilometraje,
    d.precio,
    d.estado,
    d.imagen_url,
  ];
}

function mensajeDuplicado(error) {
  return error.constraint && error.constraint.includes("vin")
    ? "Ya existe un vehículo con ese VIN"
    : "Ya existe un vehículo con ese código";
}

// Obtener todos los vehículos
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM public.vehiculos ORDER BY id DESC"
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener vehículos:", error.message);
    res.status(500).json({ mensaje: "Error al obtener vehículos" });
  }
});

// Registrar un vehículo nuevo
router.post("/", async (req, res) => {
  try {
    const { error, datos } = validarVehiculo(req.body);

    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const resultado = await pool.query(
      `INSERT INTO public.vehiculos
       (codigo, marca, modelo, anio, tipo, motor, combustible,
        transmision, color, vin, condicion, kilometraje, precio,
        estado, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      valoresDe(datos)
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al registrar vehículo:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({ mensaje: mensajeDuplicado(error) });
    }

    res.status(500).json({ mensaje: "Error al registrar vehículo" });
  }
});

// Editar los datos de un vehículo
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({ mensaje: "Identificador de vehículo inválido" });
    }

    const { error, datos } = validarVehiculo(req.body);

    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    const resultado = await pool.query(
      `UPDATE public.vehiculos
       SET codigo = $1,
           marca = $2,
           modelo = $3,
           anio = $4,
           tipo = $5,
           motor = $6,
           combustible = $7,
           transmision = $8,
           color = $9,
           vin = $10,
           condicion = $11,
           kilometraje = $12,
           precio = $13,
           estado = $14,
           imagen_url = $15
       WHERE id = $16
       RETURNING *`,
      [...valoresDe(datos), id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al editar vehículo:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({ mensaje: mensajeDuplicado(error) });
    }

    res.status(500).json({ mensaje: "Error al editar vehículo" });
  }
});

// Eliminar un vehículo
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({ mensaje: "Identificador de vehículo inválido" });
    }

    const resultado = await pool.query(
      "DELETE FROM public.vehiculos WHERE id = $1 RETURNING id",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }

    res.json({ mensaje: "Vehículo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar vehículo:", error.message);

    // 23503 = violación de clave foránea (tiene cotizaciones asociadas)
    if (error.code === "23503") {
      return res.status(409).json({
        mensaje: "No se puede eliminar el vehículo porque tiene cotizaciones asociadas",
      });
    }

    res.status(500).json({ mensaje: "Error al eliminar vehículo" });
  }
});

module.exports = router;