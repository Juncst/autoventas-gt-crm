const express = require("express");

const {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
} = require("../controllers/usuariosController");

const { verificarToken } = require("../middleware/authMiddleware");
const { permitirRoles } = require("../middleware/rolesMiddleware");

const router = express.Router();

router.use(verificarToken);
router.use(permitirRoles("ADMINISTRADOR"));

router.get("/", listarUsuarios);
router.post("/", crearUsuario);
router.put("/:id", actualizarUsuario);
router.patch("/:id/estado", cambiarEstadoUsuario);

module.exports = router;
