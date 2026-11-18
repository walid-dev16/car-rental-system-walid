const { Pool } = require("pg");
const readRuntimeSecret = require("./runtime-secret");
require("dotenv").config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: readRuntimeSecret("PGPASSWORD"),
  database: process.env.PGDATABASE,
});

module.exports = pool;
