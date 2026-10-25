const esIdValido = (valor) => ["string", "number"].includes(typeof valor) && /^\d+$/.test(String(valor)) &&
  Number.isSafeInteger(Number(valor)) && Number(valor) > 0 && Number(valor) <= 2147483647;

const validarUsuario = ({ nombre, apellido, correo, password, rolId }, creando) => {
  if (![nombre, apellido, correo].every(valor => typeof valor === "string" && valor.trim()) || !esIdValido(rolId)) {
    return "Completa los campos obligatorios y selecciona un rol válido";
  }
  if (nombre.trim().length > 100 || apellido.trim().length > 100 || correo.trim().length > 150) {
    return "Nombre o apellido demasiado largos (máximo 100); correo máximo 150 caracteres";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return "Correo electrónico inválido";
  if (creando || (password !== undefined && password !== "")) {
    if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return "La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes";
    }
  }
  return null;
};

module.exports = { esIdValido, validarUsuario };
