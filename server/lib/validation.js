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

function integerInRange(value, field, { min, max }) {
  const normalized = Number.parseInt(value, 10);
  if (!Number.isInteger(normalized) || normalized < min || normalized > max) {
    throw new ApiError(400, `El campo ${field} debe ser un entero entre ${min} y ${max}.`);
  }
  return normalized;
}

function isoDateTime(value, field = "fecha") {
  const normalized = requiredText(value, field, { min: 10, max: 40 });
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `El campo ${field} debe contener una fecha válida.`);
  }
  return date.toISOString();
}

function dateOnly(value, field) {
  const normalized = requiredText(value, field, { min: 10, max: 10 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new ApiError(400, `El campo ${field} debe usar el formato AAAA-MM-DD.`);
  }
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new ApiError(400, `El campo ${field} debe contener una fecha válida.`);
  }
  return normalized;
}

module.exports = {
  dateOnly,
  requiredText,
  email,
  integerInRange,
  isoDateTime,
  password,
  optionalText,
  oneOf,
  positiveInteger
};
