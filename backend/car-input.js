const { canonicalBranch } = require("./branches");

class CarInputError extends Error {}

const STATUSES = ["available", "booked", "maintenance"];

function carStatus(value, defaultStatus) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (defaultStatus && (value == null || (typeof value === "string" && !status))) return defaultStatus;
  if (!STATUSES.includes(status)) {
    throw new CarInputError(`Status must be one of ${STATUSES.join(", ")}.`);
  }
  return status;
}

function textField(value, field, maxLength, required = false) {
  if (value != null && typeof value !== "string") throw new CarInputError(`${field} must be text.`);
  const text = value?.trim();
  if (!text && required) throw new CarInputError(`${field} is required.`);
  if (text && (text.includes("\0") || Array.from(text).length > maxLength)) {
    throw new CarInputError(`${field} must contain at most ${maxLength} characters and no null bytes.`);
  }
  return text || null;
}

function wholeNumber(value, field, min, max) {
  const raw = typeof value === "string" ? value.trim() : value;
  const number = typeof raw === "number" || (typeof raw === "string" && /^\d+$/.test(raw)) ? Number(raw) : NaN;
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new CarInputError(`${field} must be a whole number from ${min} to ${max}.`);
  }
  return number;
}

function categoryText(value, field, maxLength) {
  const normalized = typeof value === "string" ? value.toLowerCase() : value;
  return textField(normalized, field, maxLength, true);
}

function dailyPrice(value) {
  const raw = typeof value === "number" ? String(value) : value;
  const price = typeof raw === "string" ? raw.trim() : "";
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(price) || Number(price) <= 0 || Number(price) > 99999999.99) {
    throw new CarInputError("Daily price must be positive, at most 99999999.99, and have at most two decimal places.");
  }
  return Number(price).toFixed(2);
}

function imageUrl(value) {
  const url = textField(value, "Image URL", 4096);
  if (!url) return null;
  try {
    const parsed = new URL(url, "https://local.invalid/");
    if (["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password &&
        !url.startsWith("//") && !/[\\\u0000-\u0020]/.test(url)) return url;
  } catch {
    // Invalid URL syntax is handled by the same validation response as invalid protocols.
  }
  throw new CarInputError("Use an HTTP, HTTPS, or local image path.");
}

function branchList(value) {
  if (value == null || value === "") return null;
  const names = typeof value === "string" ? value.split(",") : value;
  if (!Array.isArray(names) || names.some((name) => typeof name !== "string")) {
    throw new CarInputError("Available branches must be a list of branch names.");
  }
  const branches = names.map((name) => name.trim()).filter(Boolean).map(canonicalBranch);
  if (branches.includes(null)) throw new CarInputError("Choose a supported branch.");
  return [...new Set(branches)].join(", ") || null;
}

// The order matches the explicit INSERT and UPDATE column lists in cars.routes.
function carValues(body, defaultStatus) {
  const car = body ?? {};
  const optionalDoors = car.doors == null || car.doors === "";
  return [
    textField(car.brand, "Brand", 50, true),
    textField(car.model, "Model", 50, true),
    wholeNumber(car.production_year, "Production year", 1886, new Date().getFullYear() + 1),
    categoryText(car.category, "Category", 30),
    textField(car.plate_number, "Plate number", 20, true),
    wholeNumber(car.seats, "Seats", 1, 20),
    categoryText(car.transmission, "Transmission", 20),
    categoryText(car.fuel_type, "Fuel type", 20),
    dailyPrice(car.daily_price),
    carStatus(car.status, defaultStatus),
    imageUrl(car.image_url),
    textField(car.description, "Description", 20000),
    branchList(car.available_branches),
    textField(car.technical_specifications, "Technical specifications", 20000),
    textField(car.safety_features, "Safety features", 20000),
    textField(car.performance_info, "Performance information", 20000),
    optionalDoors ? null : wholeNumber(car.doors, "Doors", 1, 10),
  ];
}

module.exports = { carValues, carStatus, CarInputError };
