const { ApiError } = require("./api-error");

function requiredText(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== "string") {
    throw new ApiError(400, `El campo ${field} es obligatorio.`);
  }

  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new ApiError(
      400,
      `El campo ${field} debe tener entre ${min} y ${max} caracteres.`
    );
  }

  return normalized;
}

function email(value) {
  const normalized = requiredText(value, "correo", { min: 5, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new ApiError(400, "Ingresa un correo válido.");
  }
  return normalized;
}

function password(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128) {
    throw new ApiError(400, "La contraseña debe tener entre 8 y 128 caracteres.");
  }
  return value;
}

function optionalText(value, field, { max = 255 } = {}) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    throw new ApiError(400, `El campo ${field} debe ser texto.`);
  }

  const normalized = value.trim();
  if (normalized.length > max) {
    throw new ApiError(400, `El campo ${field} no puede superar ${max} caracteres.`);
  }
  return normalized;
}

function oneOf(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw new ApiError(400, `El campo ${field} contiene un valor no permitido.`);
  }
  return value;
}

function positiveInteger(value, field) {
  const normalized = Number.parseInt(value, 10);
  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new ApiError(400, `El campo ${field} debe ser un entero positivo.`);
  }
  return normalized;
}

module.exports = {
  requiredText,
  email,
  password,
  optionalText,
  oneOf,
  positiveInteger
};
