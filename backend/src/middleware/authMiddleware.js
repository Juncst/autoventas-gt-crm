const jwt = require("jsonwebtoken");
const pool = require("../db");
const { esIdValido } = require("../controllers/validacionUsuarios");

const verificarToken = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (typeof authorization !== "string" || !/^Bearer \S+$/i.test(authorization)) {
        return res.status(401).json({
            ok: false,
            mensaje: "Token de autenticación requerido",
        });
    }

    const token = authorization.split(" ")[1];

    let datos;
    try {
        datos = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (!esIdValido(datos.id)) throw new Error("Identificador inválido");
    } catch {
        return res.status(401).json({
            ok: false,
            mensaje: "Token inválido o expirado",
        });
    }

    try {
        const resultado = await pool.query(
            `SELECT u.id, u.nombre, u.apellido, u.correo, u.activo,
                    r.id AS "rolId", r.nombre AS rol
             FROM usuarios u INNER JOIN roles r ON r.id = u.rol_id WHERE u.id = $1`,
            [datos.id]
        );
        const usuario = resultado.rows[0];
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ ok: false, mensaje: "La sesión ya no está activa. Inicia sesión nuevamente" });
        }
        const { activo, ...usuarioActual } = usuario;
        req.usuario = usuarioActual;
        return next();
    } catch {
        return res.status(503).json({ ok: false, mensaje: "No se pudo verificar la sesión. Intenta nuevamente" });
    }
};

module.exports = {
    verificarToken,
};
