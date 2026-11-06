const { Pool } = require("pg");
const { database } = require("./config");

const pool = new Pool(database);
// An idle connection can fail during a provider restart. Handle it without
// logging connection strings, credentials, or request data.
pool.on("error", () => console.error("An idle database connection failed"));

module.exports = pool;
