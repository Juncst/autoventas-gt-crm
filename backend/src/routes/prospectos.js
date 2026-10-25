
const express = require("express");
const pool = require("../db");

const router = express.Router();

// Consultar todos los prospectos
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM prospectos ORDER BY id DESC"
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al consultar prospectos:", error.message);
    res.status(500).json({
      mensaje: "No se pudieron obtener los prospectos",
    });
  }
});

// Registrar un prospecto
router.post("/", async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      telefono,
      correo,
      vehiculo,
      detalleVehiculo,
      precio,
      asesor,
      estado,
      observaciones,
    } = req.body;

    if (!nombre?.trim() || !telefono?.trim() ||
        !correo?.trim() || !vehiculo?.trim()) {
      return res.status(400).json({
        mensaje: "Completa los campos obligatorios",
      });
    }

    const fechaCierre =
      estado === "Ganado" || estado === "Perdido"
        ? new Date()
        : null;

    const resultado = await pool.query(
      `INSERT INTO prospectos
       (codigo, nombre, descripcion, telefono, correo,
        vehiculo, detalle_vehiculo, precio, asesor,
        estado, observaciones, fecha_cierre)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        codigo || null,
        nombre,
        descripcion || null,
        telefono,
        correo,
        vehiculo,
        detalleVehiculo || null,
        Number(precio) || 0,
        asesor || null,
        estado || "Nuevo",
        observaciones || null,
        fechaCierre,
      ]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al registrar prospecto:", error.message);
    res.status(500).json({
      mensaje: "No se pudo registrar el prospecto",
    });
  }
});

// Editar un prospecto
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre,
      descripcion,
      telefono,
      correo,
      vehiculo,
      detalleVehiculo,
      precio,
      asesor,
      estado,
      observaciones,
    } = req.body;

    if (!nombre?.trim() || !telefono?.trim() ||
        !correo?.trim() || !vehiculo?.trim()) {
      return res.status(400).json({
        mensaje: "Completa los campos obligatorios",
      });
    }

    const actual = await pool.query(
      "SELECT * FROM prospectos WHERE id = $1",
      [id]
    );

    if (actual.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prospecto no encontrado",
      });
    }

    const anterior = actual.rows[0];
    const estadoNuevo = estado || anterior.estado;

    let fechaCierre = anterior.fecha_cierre;

    if (estadoNuevo !== "Ganado" && estadoNuevo !== "Perdido") {
      fechaCierre = null;
    } else if (estadoNuevo !== anterior.estado || !fechaCierre) {
      fechaCierre = new Date();
    }

    const resultado = await pool.query(
      `UPDATE prospectos
       SET nombre = $1,
           descripcion = $2,
           telefono = $3,
           correo = $4,
           vehiculo = $5,
           detalle_vehiculo = $6,
           precio = $7,
           asesor = $8,
           estado = $9,
           observaciones = $10,
           fecha_cierre = $11
       WHERE id = $12
       RETURNING *`,
      [
        nombre,
        descripcion || null,
        telefono,
        correo,
        vehiculo,
        detalleVehiculo || anterior.detalle_vehiculo,
        precio === undefined
          ? anterior.precio
          : Number(precio) || 0,
        asesor || null,
        estadoNuevo,
        observaciones || null,
        fechaCierre,
        id,
      ]
    );

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al editar prospecto:", error.message);
    res.status(500).json({
      mensaje: "No se pudo editar el prospecto",
    });
  }
});

// Eliminar un prospecto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      "DELETE FROM prospectos WHERE id = $1 RETURNING id",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prospecto no encontrado",
      });
    }

    res.json({
      mensaje: "Prospecto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar prospecto:", error.message);
    res.status(500).json({
      mensaje: "No se pudo eliminar el prospecto",
    });
  }
});

module.exports = router;
