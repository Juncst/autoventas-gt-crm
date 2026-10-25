const { Pool } = require("pg");
require("dotenv").config();

// Conexión a nuestra base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Exportamos la conexión para utilizarla en el backend
module.exports = pool;