const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const pool = require("../db");

async function migrate() {
  const directory = path.join(__dirname, "..", "migrations");
  const names = (await fs.readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  if (!names.length || names.some((name) => !/^\d{3,}_[a-z0-9_]+\.sql$/.test(name))) {
    throw new Error("Expected numbered SQL migrations in backend/migrations");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Transaction-scoped locking also works through a transaction pooler.
    await client.query("SELECT pg_advisory_xact_lock($1)", [784926151]);
    await client.query(`CREATE TABLE IF NOT EXISTS _autoluxe_migrations (
      name TEXT PRIMARY KEY,
      sha256 VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const applied = await client.query("SELECT name, sha256 FROM _autoluxe_migrations");
    const checksums = new Map(applied.rows.map((row) => [row.name, row.sha256]));
    for (const name of names) {
      const sql = await fs.readFile(path.join(directory, name), "utf8");
      const sha256 = createHash("sha256").update(sql).digest("hex");
      if (checksums.has(name)) {
        if (checksums.get(name) !== sha256) {
          throw new Error(`Already-applied migration changed: ${name}`);
        }
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO _autoluxe_migrations (name, sha256) VALUES ($1, $2)", [name, sha256]);
      console.log(`Applied migration ${name}`);
    }
    await client.query("COMMIT");
    console.log("Database migrations complete");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate()
    .catch(() => {
      console.error("Database migration failed; startup stopped. Check connectivity and migration compatibility privately.");
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = migrate;
