const express = require("express");

const { login, obtenerSesion } = require("../controllers/authController");
const { verificarToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.get("/me", verificarToken, obtenerSesion);

module.exports = router;
