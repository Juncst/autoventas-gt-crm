const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const authRoutes = require("./routes/authRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const rolesRoutes = require("./routes/rolesRoutes");

const clientesRoutes = require("./routes/clientes");
const prospectosRoutes = require("./routes/prospectos");
const seguimientoProspectosRoutes = require("./routes/seguimientoProspectos");

const app = express();

app.use(cors());
app.use(express.json());

// Comprobar que el servidor funciona
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "API AutoVentas GT funcionando",
  });
});

// Comprobar la conexión con PostgreSQL
app.get("/api/test-db", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW() AS fecha");

    res.json({
      ok: true,
      message: "Conexión con PostgreSQL exitosa",
      fecha: resultado.rows[0].fecha,
    });
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error.message);

    res.status(500).json({
      ok: false,
      message: "No se pudo conectar con PostgreSQL",
    });
  }
});

// Autenticación
app.use("/api/auth", authRoutes);

// Usuarios y roles
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/roles", rolesRoutes);

// Clientes
app.use("/api/clientes", clientesRoutes);

// Prospectos y seguimiento
app.use("/api/prospectos", prospectosRoutes);
app.use("/api/prospectos", seguimientoProspectosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
