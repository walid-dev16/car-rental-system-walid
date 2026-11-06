const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "auth-regression-tests-use-a-separate-secret-only";
let query;
const dbPath = require.resolve("../db");
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: { query: (...args) => query(...args) },
};
const auth = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { createAttemptCounter, createAuthLimiters, normalizeIp } = require("../middleware/auth-limits");

test.beforeEach(() => {
  query = async () => { throw new Error("Unexpected database query"); };
});

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    status(value) { this.statusCode = value; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

function token(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h", ...options });
}

async function authenticate(value) {
  const req = { headers: { authorization: `Bearer ${value}` } };
  const res = response();
  let next = false;
  await auth(req, res, () => { next = true; });
  return { req, res, next };
}

async function appRequest(t, routerName, path, body, options = {}) {
  // Reloading the router gives each test the same fresh startup state as a
  // separate process; production contains no test environment bypass.
  const routerPath = require.resolve(`../routes/${routerName}.routes`);
  delete require.cache[routerPath];
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  app.use(require(routerPath));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const result = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), ...options,
  });
  return { status: result.status, headers: result.headers, body: await result.json() };
}

test("deleted accounts invalidate an otherwise valid unexpired token", async () => {
  query = async () => ({ rows: [] });
  const result = await authenticate(token({ id: "12", role: "admin" }));
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.next, false);
});

test("current database role controls authorization after a role change", async () => {
  query = async (sql, values) => {
    assert.match(sql, /SELECT id, role, account_status/);
    assert.deepEqual(values, ["12"]);
    return { rows: [{ id: "12", role: "customer", account_status: "active" }] };
  };
  const result = await authenticate(token({ id: "12", role: "admin" }));
  assert.equal(result.next, true);
  assert.deepEqual(result.req.user, { id: "12", role: "customer" });
  allowRoles("admin")(result.req, result.res, () => assert.fail("stale admin role was accepted"));
  assert.equal(result.res.statusCode, 403);
});

test("known current roles and pending accounts authenticate with exact BIGINT ids", async () => {
  const id = "9223372036854775807";
  for (const role of ["customer", "staff", "admin"]) {
    query = async (sql, values) => {
      assert.deepEqual(values, [id]);
      return { rows: [{ id, role, account_status: "pending" }] };
    };
    const result = await authenticate(token({ id, role: "obsolete-role" }));
    assert.equal(result.next, true);
    let allowed = false;
    allowRoles(role)(result.req, result.res, () => { allowed = true; });
    assert.equal(allowed, true);
  }
});

test("disabled, missing-status, and unknown-role accounts cannot authenticate", async () => {
  for (const account_status of ["blocked", "inactive", "deleted", undefined]) {
    query = async () => ({ rows: [{ id: "1", role: "admin", account_status }] });
    assert.equal((await authenticate(token({ id: "1" }))).res.statusCode, 401);
  }
  query = async () => ({ rows: [{ id: "1", role: "owner", account_status: "active" }] });
  assert.equal((await authenticate(token({ id: "1" }))).res.statusCode, 401);
});

test("malformed ids, wrong algorithms, expired and malformed tokens stop before the database", async () => {
  let calls = 0;
  query = async () => { calls += 1; return { rows: [] }; };
  const invalid = ["bad.token", token({ id: "0" }), token({ id: "-1" }), token({ id: "1 OR 1=1" }),
    token({ id: "9223372036854775808" }), token({ id: 9007199254740992 }), token({ role: "admin" }),
    token({ id: "1" }, { algorithm: "HS384" }), token({ id: "1" }, { expiresIn: -1 })];
  for (const value of invalid) assert.equal((await authenticate(value)).res.statusCode, 401);
  assert.equal(calls, 0);
});

test("authentication database failures return a generic unavailable response", async () => {
  query = async () => { throw new Error("password=secret database.internal"); };
  const result = await authenticate(token({ id: "1" }));
  assert.equal(result.res.statusCode, 503);
  assert.deepEqual(result.res.body, { message: "Service temporarily unavailable" });
});

test("account login limit spans IPs, email case and padding; Retry-After expires", () => {
  let now = 0;
  const limits = createAuthLimiters({ loginAccountLimit: 2, loginIpLimit: 10,
    loginWindowMs: 2000, clock: () => now });
  function attempt(ip, email) {
    const res = response();
    let next = false;
    limits.login({ ip, body: { email } }, res, () => { next = true; });
    return { res, next };
  }
  assert.equal(attempt("192.0.2.1", "User@Example.test").next, true);
  assert.equal(attempt("192.0.2.2", " ".repeat(150) + "user@example.test ").next, true);
  const blocked = attempt("192.0.2.3", "USER@EXAMPLE.TEST");
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers["Retry-After"], "2");
  now = 2000;
  assert.equal(attempt("192.0.2.3", "user@example.test").next, true);
});

test("IP login and registration limits apply independently before expensive work", () => {
  const limits = createAuthLimiters({ loginIpLimit: 1, loginAccountLimit: 10, registerIpLimit: 1 });
  const req = { ip: "192.0.2.1", body: { email: "one@example.test" } };
  limits.login(req, response(), () => {});
  const loginRes = response();
  limits.login({ ...req, body: { email: "two@example.test" } }, loginRes, () => assert.fail("IP bypass"));
  assert.equal(loginRes.statusCode, 429);
  let registered = false;
  limits.register(req, response(), () => { registered = true; });
  assert.equal(registered, true);
  const registrationRes = response();
  limits.register(req, registrationRes, () => assert.fail("registration limit bypass"));
  assert.equal(registrationRes.statusCode, 429);
});

test("bounded counters deny new keys at capacity and reclaim expired entries", () => {
  let now = 0;
  const counter = createAttemptCounter({ limit: 1, windowMs: 1000, maxEntries: 2, clock: () => now });
  assert.equal(counter.consume("one").allowed, true);
  assert.equal(counter.consume("two").allowed, true);
  assert.equal(counter.consume("three").allowed, false);
  assert.equal(counter.consume("one").allowed, false);
  assert.equal(counter.size, 2);
  now = 1000;
  assert.equal(counter.consume("three").allowed, true);
  assert.equal(counter.size, 1);
});

test("IPv6 normalization groups equivalent /64 addresses and IPv4 mapped forms", () => {
  assert.equal(normalizeIp("2001:db8::1"), normalizeIp("2001:0db8:0000:0000:ffff::2"));
  assert.equal(normalizeIp("::ffff:192.0.2.1"), normalizeIp("192.0.2.1"));
  assert.equal(normalizeIp("0:0:0:0:0:ffff:c000:201"), normalizeIp("192.0.2.1"));
  assert.notEqual(normalizeIp("2001:db8::1"), normalizeIp("2001:db8:0:1::1"));
  assert.equal(normalizeIp("untrusted-input"), "unknown");
});

test("registration ignores role injection, trims identity, and uses bcrypt cost 12", async (t) => {
  const originalHash = bcrypt.hash;
  t.after(() => { bcrypt.hash = originalHash; });
  bcrypt.hash = async (password, rounds) => {
    assert.equal(password, "long-enough-password");
    assert.equal(rounds, 12);
    return "mocked-password-hash";
  };
  query = async (sql, values) => {
    if (sql.startsWith("SELECT")) { assert.deepEqual(values, ["user@example.test"]); return { rows: [] }; }
    assert.match(sql, /INSERT INTO users \(first_name, last_name, email, password_hash\)/);
    assert.deepEqual(values, ["Test", "User", "user@example.test", "mocked-password-hash"]);
    return { rows: [{ id: "1", first_name: "Test", last_name: "User", email: values[2], role: "customer" }] };
  };
  const result = await appRequest(t, "auth", "/register", { first_name: " Test ", last_name: " User ",
    email: " USER@Example.test ", password: "long-enough-password", role: "admin", account_status: "active" });
  assert.equal(result.status, 201);
  assert.equal(result.body.user.role, "customer");
  assert.equal(JSON.stringify(result.body).includes("password"), false);
});

test("registration rejects objects, weak passwords, and bcrypt byte-limit overflow before hashing", async (t) => {
  const originalHash = bcrypt.hash;
  t.after(() => { bcrypt.hash = originalHash; });
  bcrypt.hash = async () => assert.fail("Invalid registration reached bcrypt");
  const details = { first_name: "Test", last_name: "User", email: "user@example.test", password: "short" };
  for (const body of [details, { ...details, first_name: {} }, { ...details, password: "🔑".repeat(19) },
    { ...details, password: "valid-password", email: "not-an-email" }, { ...details, last_name: "x".repeat(51) }]) {
    assert.equal((await appRequest(t, "auth", "/register", body)).status, 400);
  }
});

test("registration duplicate races return conflict without database details", async (t) => {
  const originalHash = bcrypt.hash;
  t.after(() => { bcrypt.hash = originalHash; });
  bcrypt.hash = async () => "mocked-password-hash";
  query = async (sql) => {
    if (sql.startsWith("SELECT")) return { rows: [] };
    throw Object.assign(new Error("private constraint and query data"), { code: "23505" });
  };
  const result = await appRequest(t, "auth", "/register", { first_name: "Test", last_name: "User",
    email: "user@example.test", password: "long-enough-password" });
  assert.equal(result.status, 409);
  assert.deepEqual(result.body, { message: "Email already exists" });
});

test("login accepts existing short passwords and signs HS256 tokens for enabled users", async (t) => {
  const originalCompare = bcrypt.compare;
  t.after(() => { bcrypt.compare = originalCompare; });
  bcrypt.compare = async (password) => { assert.equal(password, "legacy"); return true; };
  query = async (sql, values) => {
    assert.deepEqual(values, ["user@example.test"]);
    return { rows: [{ id: "3", first_name: "Test", last_name: "User", email: values[0],
      password_hash: "private-hash", role: "customer", account_status: "pending" }] };
  };
  const result = await appRequest(t, "auth", "/login", { email: " USER@EXAMPLE.TEST ", password: "legacy" });
  assert.equal(result.status, 200);
  const decoded = jwt.verify(result.body.token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  assert.equal(decoded.exp - decoded.iat, 3600);
  assert.equal(decoded.id, "3");
  assert.equal(JSON.stringify(result.body).includes("private-hash"), false);
});

test("unknown and disabled accounts have the same generic login response", async (t) => {
  const originalCompare = bcrypt.compare;
  t.after(() => { bcrypt.compare = originalCompare; });
  let comparisons = 0;
  bcrypt.compare = async () => { comparisons += 1; return true; };
  for (const user of [undefined, { id: "1", role: "admin", account_status: "blocked", password_hash: "hash" }]) {
    query = async () => ({ rows: user ? [user] : [] });
    const result = await appRequest(t, "auth", "/login", { email: "user@example.test", password: "legacy" });
    assert.equal(result.status, 401);
    assert.deepEqual(result.body, { message: "Invalid credentials" });
  }
  assert.equal(comparisons, 2);
});

test("profile rejects object values and deletion returns only public identity columns", async (t) => {
  const authorization = `Bearer ${token({ id: "1", role: "admin" })}`;
  query = async (sql, values) => {
    if (sql.startsWith("SELECT")) return { rows: [{ id: "1", role: "admin", account_status: "active" }] };
    assert.match(sql, /RETURNING id, first_name, last_name, email, role$/);
    assert.equal(sql.includes("RETURNING *"), false);
    assert.deepEqual(values, ["2"]);
    return { rows: [{ id: "2", first_name: "Test", last_name: "User", email: "user@example.test", role: "customer" }] };
  };
  const headers = { "Content-Type": "application/json", Authorization: authorization };
  const invalid = await appRequest(t, "users", "/profile", { phone: {} }, { method: "PUT", headers });
  assert.equal(invalid.status, 400);
  const deletion = await appRequest(t, "users", "/2", undefined, { method: "DELETE", headers });
  assert.equal(deletion.status, 200);
  assert.deepEqual(Object.keys(deletion.body.user).sort(), ["id", "first_name", "last_name", "email", "role"].sort());
});
