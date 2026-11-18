const { readdir, readFile } = require("node:fs/promises");
const path = require("node:path");
const pool = require("./db");

async function migrate() {
  const dir = path.join(__dirname, "migrations");
  const files = (await readdir(dir)).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('autoluxe_schema'))");
    await client.query("CREATE TABLE IF NOT EXISTS public.schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    const { rows } = await client.query("SELECT filename FROM public.schema_migrations");
    const applied = new Set(rows.map((row) => row.filename));
    for (const name of files) {
      if (applied.has(name)) continue;
      await client.query(await readFile(path.join(dir, name), "utf8"));
      await client.query("INSERT INTO public.schema_migrations (filename) VALUES ($1)", [name]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

migrate().catch((error) => {
  console.error("Database migration failed:", error.code || error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
