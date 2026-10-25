const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db");

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo?.trim() || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: "Correo y contraseña son obligatorios",
            });
        }

        const resultado = await pool.query(
            `SELECT
        u.id,
        u.nombre,
        u.apellido,
        u.correo,
        u.password_hash,
        u.activo,
        r.id AS rol_id,
        r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       WHERE LOWER(u.correo) = LOWER($1)`,
            [correo.trim()]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                ok: false,
                mensaje: "Credenciales incorrectas",
            });
        }

        const usuario = resultado.rows[0];

        if (!usuario.activo) {
            return res.status(403).json({
                ok: false,
                mensaje: "Usuario inactivo",
            });
        }

        const passwordCorrecto = await bcrypt.compare(
            password,
            usuario.password_hash
        );

        if (!passwordCorrecto) {
            return res.status(401).json({
                ok: false,
                mensaje: "Credenciales incorrectas",
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                rolId: usuario.rol_id,
                rol: usuario.rol,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h",
            }
        );

        return res.json({
            ok: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                correo: usuario.correo,
                rol: usuario.rol,
            },
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);

        return res.status(500).json({
            ok: false,
            mensaje: "Error interno del servidor",
        });
    }
};

module.exports = {
    login,
};