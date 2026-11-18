const { lstatSync, readFileSync } = require("node:fs");

const defaultPaths = {
  PGPASSWORD: "/run/secrets/app_pgpassword",
  JWT_SECRET: "/run/secrets/app_jwt_secret",
};

function readRuntimeSecret(name) {
  const configuredPath = process.env[`${name}_FILE`];
  const filePath = configuredPath ?? defaultPaths[name];
  let value;

  try {
    if (configuredPath !== undefined || lstatSync(filePath, { throwIfNoEntry: false })) {
      value = readFileSync(filePath, "utf8").replace(/\r?\n$/, "");
    } else {
      value = process.env[name];
    }
  } catch {
    throw new Error(`Cannot read the secret file for ${name}`);
  }

  if (!value || !value.trim()) {
    throw new Error(`Missing or empty runtime secret for ${name}`);
  }
  return value;
}

module.exports = readRuntimeSecret;
