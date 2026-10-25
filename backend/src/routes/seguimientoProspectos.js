
const express = require("express");
const pool = require("../db");

const router = express.Router();

// Consultar las notas de un prospecto
router.get("/:id/notas", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, contenido AS texto, fecha
       FROM notas_prospectos
       WHERE prospecto_id = $1
       ORDER BY fecha DESC, id DESC`,
      [req.params.id]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al consultar notas:", error.message);

    res.status(500).json({
      mensaje: "No se pudieron obtener las notas",
    });
  }
});

// Guardar una nota nueva
router.post("/:id/notas", async (req, res) => {
  try {
    const { contenido } = req.body;

    if (!contenido || !contenido.trim()) {
      return res.status(400).json({
        mensaje: "Escribe una nota antes de guardarla",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO notas_prospectos (prospecto_id, contenido)
       VALUES ($1, $2)
       RETURNING id, contenido AS texto, fecha`,
      [req.params.id, contenido.trim()]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al guardar nota:", error.message);

    res.status(500).json({
      mensaje: "No se pudo guardar la nota",
    });
  }
});

// Consultar el historial de actividades
router.get("/:id/actividades", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, tipo, titulo, descripcion, fecha
       FROM actividades_prospectos
       WHERE prospecto_id = $1
       ORDER BY fecha DESC, id DESC`,
      [req.params.id]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al consultar actividades:", error.message);

    res.status(500).json({
      mensaje: "No se pudo obtener el historial",
    });
  }
});

// Registrar una actividad
router.post("/:id/actividades", async (req, res) => {
  try {
    const { tipo, titulo, descripcion } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({
        mensaje: "El título de la actividad es obligatorio",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO actividades_prospectos
       (prospecto_id, tipo, titulo, descripcion)
       VALUES ($1, $2, $3, $4)
       RETURNING id, tipo, titulo, descripcion, fecha`,
      [
        req.params.id,
        tipo || "Seguimiento",
        titulo.trim(),
        descripcion || null,
      ]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al registrar actividad:", error.message);

    res.status(500).json({
      mensaje: "No se pudo registrar la actividad",
    });
  }
});

module.exports = router;
