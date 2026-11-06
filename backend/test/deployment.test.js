const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { once } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");

// Public fixtures only: no live database, provider credentials, or TLS sockets.
const fixtureSecret = "c4d8a1f7b326e90cd7a4e15fb81d5632a6e9d8c4f17a0b35";
const fixtureHostname = "ep-autoluxe-fixture-123.eu-central-1.aws.neon.tech";
const fixtureDatabaseURL = `postgresql://fixture_user:fixture_password@${fixtureHostname}/autoluxe`;

function productionEnvironment(overrides = {}) {
  return {
    ...process.env,
    NODE_ENV: "production",
    JWT_SECRET: fixtureSecret,
    DATABASE_URL: fixtureDatabaseURL,
    PORT: "5000",
    TRUST_PROXY_HOPS: "1",
    PGPOOL_MAX: "5",
    PGPORT: "5432",
    ...overrides,
  };
}

function readProductionConfig(overrides = {}) {
  return spawnSync(process.execPath, ["--eval", "process.stdout.write(JSON.stringify(require('./config')));"], {
    cwd: path.join(__dirname, ".."),
    env: productionEnvironment(overrides),
    encoding: "utf8",
    timeout: 10000,
    windowsHide: true,
  });
}

test("production refuses missing, short, repetitive, and placeholder JWT secrets", () => {
  for (const JWT_SECRET of ["", "short", "a".repeat(64), "replace-me-with-your-secret-before-production"]) {
    const result = readProductionConfig({ JWT_SECRET });
    assert.equal(result.status, 1, "A weak production secret was accepted");
    assert.match(result.stderr, /Production requires.*JWT_SECRET/);
    assert.equal(result.stdout, "");
  }
});

test("production accepts a strong fixture secret without starting a listener", () => {
  const result = readProductionConfig();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).isProduction, true);
});

test("database URI SSL switches cannot disable certificate verification or replace the Neon hostname", () => {
  const originalURL = new URL(fixtureDatabaseURL);
  for (const [name, value] of Object.entries({
    sslmode: "disable",
    sslcert: "/private/fixture-client.pem",
    sslkey: "/private/fixture-key.pem",
    sslrootcert: "/private/fixture-root.pem",
    ssl: "false",
    uselibpqcompat: "true",
  })) originalURL.searchParams.set(name, value);
  originalURL.searchParams.set("application_name", "fixture-demo");
  const result = readProductionConfig({ DATABASE_URL: originalURL.toString() });
  assert.equal(result.status, 0, result.stderr);
  const { database } = JSON.parse(result.stdout);
  const sanitizedURL = new URL(database.connectionString);
  assert.equal(sanitizedURL.hostname, fixtureHostname);
  assert.equal(sanitizedURL.pathname, "/autoluxe");
  assert.equal(sanitizedURL.username, "fixture_user");
  assert.equal(sanitizedURL.searchParams.get("application_name"), "fixture-demo");
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert", "ssl", "uselibpqcompat"]) {
    assert.equal(sanitizedURL.searchParams.has(name), false, `${name} survived sanitization`);
  }
  assert.deepEqual(database.ssl, { rejectUnauthorized: true });
});

let origin;
let frontendHTML;
let server;
test.before(async () => {
  Object.assign(process.env, productionEnvironment());
  const databasePath = require.resolve("../db");
  require.cache[databasePath] = {
    id: databasePath,
    filename: databasePath,
    loaded: true,
    exports: { query: async () => assert.fail("Static deployment checks must not connect to PostgreSQL") },
  };
  frontendHTML = fs.readFileSync(path.join(__dirname, "..", "..", "frontend", "dist", "index.html"), "utf8");
  const app = require("../app");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => {
  if (!server) return resolve();
  server.close(resolve);
  server.closeAllConnections();
}));

function request(route, options = {}) {
  return fetch(`${origin}${route}`, { redirect: "manual", ...options });
}

test("production serves the built SPA for browser GET navigation and real bundled assets", async () => {
  for (const route of ["/", "/cars", "/cars/123"]) {
    const result = await request(route, { headers: { Accept: "text/html" } });
    assert.equal(result.status, 200);
    assert.match(result.headers.get("content-type"), /^text\/html/);
    assert.equal(await result.text(), frontendHTML);
  }
  const scriptPath = frontendHTML.match(/<script[^>]+src="([^"]+)"/)[1];
  assert.match(scriptPath, /^\/assets\/.+\.js$/);
  const script = await request(scriptPath);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  assert.notEqual(await script.text(), frontendHTML);
});

test("SPA fallback excludes non-HTML requests and methods other than GET", async () => {
  for (const options of [
    { headers: { Accept: "application/json" } },
    { headers: { Accept: "*/*" } },
    { method: "POST", headers: { Accept: "text/html" } },
    { method: "PUT", headers: { Accept: "text/html" } },
    { method: "HEAD", headers: { Accept: "text/html" } },
  ]) {
    const result = await request("/cars/123", options);
    assert.equal(result.status, 404);
    assert.notEqual(await result.text(), frontendHTML);
  }
});

test("unknown API endpoints remain JSON 404 even when the caller accepts HTML", async () => {
  for (const route of ["/api", "/api/does-not-exist", "/API/does-not-exist"]) {
    const result = await request(route, { headers: { Accept: "text/html" } });
    assert.equal(result.status, 404);
    assert.match(result.headers.get("content-type"), /^application\/json/);
    assert.deepEqual(await result.json(), { message: "API route not found" });
  }
});

test("production never exposes environment files, source files, or missing assets", async () => {
  for (const route of [
    "/.env", "/backend/.env", "/backend/config.js", "/backend/index.js",
    "/src/main.jsx", "/frontend/src/main.jsx", "/backend/package.json",
    "/package.json", "/assets/does-not-exist.js",
  ]) {
    const result = await request(route, { headers: { Accept: "text/html" } });
    assert.equal(result.status, 404, `${route} was publicly available`);
    assert.notEqual(await result.text(), frontendHTML);
  }
});

test("hosting health response contains no configuration or database details", async () => {
  const result = await request("/api/health");
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { status: "ok" });
});
