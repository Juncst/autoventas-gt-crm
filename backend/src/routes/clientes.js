
const express = require("express");
const pool = require("../db");

const router = express.Router();

// Obtener todos los clientes
router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      "SELECT * FROM clientes ORDER BY id DESC"
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error.message);
    res.status(500).json({ mensaje: "Error al obtener clientes" });
  }
});

// Registrar un cliente nuevo
router.post("/", async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      nit,
      telefono,
      correo,
      direccion,
      tipo,
      asesor,
      observaciones,
      estado,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        mensaje: "El nombre del cliente es obligatorio",
      });
    }

    const resultado = await pool.query(
      `INSERT INTO clientes
       (codigo, nombre, nit, telefono, correo, direccion,
        tipo, asesor, observaciones, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        codigo || null,
        nombre,
        nit || null,
        telefono || null,
        correo || null,
        direccion || null,
        tipo || null,
        asesor || null,
        observaciones || null,
        estado || "Activo",
      ]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al registrar cliente:", error.message);
    res.status(500).json({ mensaje: "Error al registrar cliente" });
  }
});

// Editar los datos de un cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      codigo,
      nombre,
      nit,
      telefono,
      correo,
      direccion,
      tipo,
      asesor,
      observaciones,
      estado,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        mensaje: "El nombre del cliente es obligatorio",
      });
    }

    const resultado = await pool.query(
      `UPDATE clientes
       SET codigo = $1,
           nombre = $2,
           nit = $3,
           telefono = $4,
           correo = $5,
           direccion = $6,
           tipo = $7,
           asesor = $8,
           observaciones = $9,
           estado = $10
       WHERE id = $11
       RETURNING *`,
      [
        codigo || null,
        nombre,
        nit || null,
        telefono || null,
        correo || null,
        direccion || null,
        tipo || null,
        asesor || null,
        observaciones || null,
        estado || "Activo",
        id,
      ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error("Error al editar cliente:", error.message);
    res.status(500).json({ mensaje: "Error al editar cliente" });
  }
});

// Eliminar un cliente
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      "DELETE FROM clientes WHERE id = $1 RETURNING id",
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    res.json({
      mensaje: "Cliente eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar cliente:", error.message);
    res.status(500).json({ mensaje: "Error al eliminar cliente" });
  }
});

module.exports = router;
