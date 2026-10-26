const pool = require("../db");

const listarRoles = async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, nombre
        FROM roles
        ORDER BY id`
        );

        return res.json({
            ok: true,
            roles: resultado.rows,
        });
    } catch (error) {
        console.error("Error al consultar roles:", error.message);

        return res.status(500).json({
            ok: false,
            mensaje: "No se pudieron obtener los roles",
        });
    }
};

module.exports = {
    listarRoles,
};