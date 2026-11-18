const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Load the API routes with an isolated database and signing key in this test process.
const key = randomBytes(32).toString("hex");
const db = { query: mock.fn(), connect: mock.fn() };
require.cache[require.resolve("../db")] = { exports: db };
require.cache[require.resolve("../runtime-secret")] = { exports: () => key };
const auth = require("../routes/auth.routes");
const users = require("../routes/users.routes");
const limitAttempts = require("../middleware/auth-rate-limit");

function request(router, method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = { method, url, body, headers, ip: "127.0.0.1" };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      set() { return this; },
      json(data) { resolve({ status: this.statusCode, data }); },
    };
    router.handle(req, res, (err) => reject(err ?? new Error("Route not found")));
  });
}

test("registration enforces the bcrypt byte limit and hides whether an email was registered", async () => {
  const input = { first_name: "Test", last_name: "User", email: "Test@example.invalid", password: "Sample passphrase" };
  const submitted = [];
  db.query.mock.mockImplementation(async (sql, values) => {
    assert.match(sql, /ON CONFLICT \(email\) DO NOTHING/);
    submitted.push(values);
    return { rowCount: submitted.length === 1 ? 1 : 0 };
  });
  const first = await request(auth, "POST", "/register", input);
  const duplicate = await request(auth, "POST", "/register", input);
  assert.equal(first.status, 201);
  assert.deepEqual(first, duplicate);
  assert.deepEqual(Object.keys(first.data), ["message"]);
  assert.equal(submitted[0][2], input.email.toLowerCase());
  assert.ok(await bcrypt.compare(input.password, submitted[0][3]));

  for (const password of ["short", "𝄞".repeat(19)]) {
    assert.equal((await request(auth, "POST", "/register", { ...input, password })).status, 400);
  }
  assert.equal(submitted.length, 2);
});

test("pending customers can use a legacy password and blocked accounts receive the generic login failure", async () => {
  const password = "old";
  const user = {
    id: "2", role: "customer", email: "test@example.invalid", password_hash: await bcrypt.hash(password, 4),
    phone: "00000", street_address: "Example Street", city: "Example City", postal_code: "00000",
  };
  let accountStatus = "pending";
  db.query.mock.mockImplementation(async (sql, values) => {
    assert.match(sql, /account_status\)\) = ANY/);
    return { rows: values[2].includes(accountStatus) ? [user] : [] };
  });
  const body = { email: user.email, password };
  const signedIn = await request(auth, "POST", "/login", body);
  assert.equal(signedIn.status, 200);
  assert.equal(jwt.verify(signedIn.data.token, key).id, user.id);
  assert.equal(signedIn.data.user.password_hash, undefined);
  for (const field of ["phone", "street_address", "city", "postal_code"]) {
    assert.equal(signedIn.data.user[field], user[field]);
  }
  accountStatus = "blocked";
  assert.equal((await request(auth, "POST", "/login", body)).status, 401);
  accountStatus = "inactive";
  assert.equal((await request(auth, "POST", "/login", body)).status, 401);
});

test("administrative routes consult current membership for signed sessions", async () => {
  const headers = { authorization: "Bearer " + jwt.sign({ id: "1", role: "admin" }, key, { expiresIn: 60 }) };
  let current = { id: "1", role: "customer" };
  db.query.mock.mockImplementation(async (sql, args) => {
    assert.match(sql, /SELECT id, role FROM users/);
    assert.equal(args[0], "1");
    assert.equal(args[1].includes("blocked"), false);
    return { rows: current ? [current] : [] };
  });
  assert.equal((await request(users, "GET", "/", {}, headers)).status, 403);
  current = null;
  assert.equal((await request(users, "GET", "/", {}, headers)).status, 401);
});

test("account deletion preserves the last administrator and booking history and returns only an ID", async () => {
  const admin = { id: "1", role: "admin" };
  const headers = { authorization: "Bearer " + jwt.sign(admin, key, { expiresIn: 60 }) };
  db.query.mock.mockImplementation(async () => ({ rows: [admin] }));
  let otherUserHasBookings = true;
  let deletions = 0;
  db.connect.mock.mockImplementation(async () => ({
    async query(sql, args) {
      if (sql.includes("FOR UPDATE")) {
        return { rows: [
          { id: "1", active_admin: true, target: args[0] === "1" },
          { id: "2", active_admin: false, target: args[0] === "2" },
        ].filter((row) => row.target || row.active_admin) };
      }
      if (sql.startsWith("SELECT 1 FROM bookings")) return { rowCount: Number(otherUserHasBookings) };
      if (sql.startsWith("DELETE")) { assert.doesNotMatch(sql, /RETURNING \*/); deletions += 1; }
      return { rows: [] };
    },
    release() {},
  }));
  assert.equal((await request(users, "DELETE", "/1", {}, headers)).status, 409);
  assert.equal((await request(users, "DELETE", "/2", {}, headers)).status, 409);
  assert.equal(deletions, 0);
  otherUserHasBookings = false;
  const result = await request(users, "DELETE", "/2", {}, headers);
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.user, { id: "2" });
  assert.equal(deletions, 1);
});

test("rate limit returns Retry-After and releases a key when its window expires", (t) => {
  let time = 1000;
  t.mock.method(Date, "now", () => time);
  const limit = limitAttempts(1, (req) => req.ip);
  const req = { ip: "test" };
  const res = { set(name, value) { assert.equal(name, "Retry-After"); this.retry = value; }, status(value) { this.code = value; return this; }, json() {} };
  let allowed = 0;
  const next = () => { allowed += 1; };
  limit(req, res, next);
  limit(req, res, next);
  assert.equal(allowed, 1);
  assert.equal(res.code, 429);
  assert.equal(res.retry, "900");
  time += 900000;
  limit(req, res, next);
  assert.equal(allowed, 2);
});
