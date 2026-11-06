const path = require("node:path");

require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const isProduction = process.env.NODE_ENV === "production";

function integerSetting(name, fallback, minimum, maximum) {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

if (isProduction) {
  const secret = process.env.JWT_SECRET || "";
  if (
    secret.length < 32 ||
    new Set(secret).size < 8 ||
    /change.?me|replace.?me|your.?secret|example|development|password/i.test(secret)
  ) {
    throw new Error("Production requires a unique, randomly generated JWT_SECRET of at least 32 characters");
  }
}

const database = {
  max: integerSetting("PGPOOL_MAX", 5, 1, 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 15000,
  statement_timeout: 15000,
  idle_in_transaction_session_timeout: 15000,
  application_name: "autoluxe",
};

if (process.env.DATABASE_URL) {
  let url;
  try {
    url = new URL(process.env.DATABASE_URL);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
      throw new Error("invalid database URL");
    }
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }
  // pg connection-string SSL options can replace the ssl object. Remove them
  // so every DATABASE_URL connection verifies the server certificate and name.
  for (const parameter of ["sslmode", "sslcert", "sslkey", "sslrootcert", "ssl", "uselibpqcompat"]) {
    url.searchParams.delete(parameter);
  }
  database.connectionString = url.toString();
  database.ssl = { rejectUnauthorized: true };
} else {
  database.host = process.env.PGHOST || "localhost";
  database.port = integerSetting("PGPORT", 5432, 1, 65535);
  database.user = process.env.PGUSER;
  database.password = process.env.PGPASSWORD;
  database.database = process.env.PGDATABASE;
  // PG* settings support the private local Docker database. Production PG*
  // connections also require a trusted TLS certificate.
  database.ssl = isProduction || process.env.PGSSL === "true"
    ? { rejectUnauthorized: true }
    : false;
}

module.exports = {
  isProduction,
  port: integerSetting("PORT", 5000, 1, 65535),
  trustProxy: integerSetting("TRUST_PROXY_HOPS", isProduction ? 1 : 0, 0, 10),
  frontendDist: path.join(__dirname, "..", "frontend", "dist"),
  database,
};
