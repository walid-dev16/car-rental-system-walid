const readline = require("node:readline");
const bcrypt = require("bcryptjs");
const pool = require("../db");

function publicError(message) {
  const error = new Error(message);
  error.safeToDisplay = true;
  return error;
}

function options() {
  const result = {};
  const allowed = new Set(["--email", "--first-name", "--last-name"]);
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    if (!allowed.has(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) {
      throw publicError("Usage: node backend/scripts/bootstrap-admin.js --email EMAIL --first-name NAME --last-name NAME");
    }
    result[args[index]] = args[index + 1].trim();
  }
  const email = (result["--email"] || "").toLowerCase();
  const firstName = result["--first-name"] || "";
  const lastName = result["--last-name"] || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100 || !firstName || !lastName || firstName.length > 50 || lastName.length > 50) {
    throw publicError("Provide a valid email and first/last names of at most 50 characters");
  }
  return { email, firstName, lastName };
}

function hiddenPrompt(label) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const previousRawMode = input.isRaw;
    let value = "";
    function finish(error) {
      input.removeListener("keypress", onKeypress);
      input.setRawMode(previousRawMode);
      input.pause();
      process.stderr.write("\n");
      if (error) reject(error);
      else resolve(value);
    }
    function onKeypress(text, key = {}) {
      if (key.ctrl && key.name === "c") return finish(publicError("Cancelled"));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") {
        value = Array.from(value).slice(0, -1).join("");
      } else if (key.ctrl && key.name === "u") {
        value = "";
      } else if (text && !key.ctrl && !key.meta && !/[\u0000-\u001f\u007f]/.test(text)) {
        value += text;
        if (Buffer.byteLength(value, "utf8") > 1024) finish(publicError("Password input too long"));
      }
    }
    process.stderr.write(label);
    readline.emitKeypressEvents(input);
    input.setRawMode(true);
    input.on("keypress", onKeypress);
    input.resume();
  });
}

async function readPassword() {
  let password;
  if (process.stdin.isTTY) {
    password = await hiddenPrompt("New administrator password (hidden): ");
    const confirmation = await hiddenPrompt("Confirm password (hidden): ");
    if (confirmation !== password) throw publicError("Passwords do not match");
  } else {
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > 1024) throw publicError("Password input too long");
      chunks.push(Buffer.from(chunk));
    }
    password = Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
  }
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72 || /[\r\n\u0000]/.test(password) || new Set(password).size < 5) {
    throw publicError("Use a unique password of at least 12 characters and at most 72 UTF-8 bytes, on one line");
  }
  return password;
}

async function bootstrapAdmin() {
  const { email, firstName, lastName } = options();
  const password = await readPassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [784926152]);
    const existing = await client.query("SELECT id FROM users WHERE role = 'admin' OR LOWER(email) = $1 LIMIT 1", [email]);
    if (existing.rowCount) throw publicError("Bootstrap refused: an administrator or that email already exists");
    await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, account_status)
       VALUES ($1, $2, $3, $4, 'admin', 'active')`,
      [firstName, lastName, email, passwordHash]
    );
    await client.query("COMMIT");
    console.log("First administrator created. Store the password privately.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  bootstrapAdmin()
    .catch((error) => {
      console.error(error.safeToDisplay ? error.message : "Administrator creation failed; inspect the database privately");
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = bootstrapAdmin;
