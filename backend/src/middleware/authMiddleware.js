const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({
            ok: false,
            mensaje: "Token de autenticación requerido",
        });
    }

    const token = authorization.split(" ")[1];

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = datos;

        next();
    } catch (error) {
        return res.status(401).json({
            ok: false,
            mensaje: "Token inválido o expirado",
        });
    }
};

module.exports = {
    verificarToken,
};