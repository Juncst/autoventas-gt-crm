const express = require("express");

const { listarRoles } = require("../controllers/rolesController");
const { verificarToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verificarToken, listarRoles);

module.exports = router;