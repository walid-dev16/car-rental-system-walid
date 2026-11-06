const { port } = require("./config");
const app = require("./app");
const pool = require("./db");

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`AutoLuxe listening on port ${port}`);
});

server.requestTimeout = 30000;
server.headersTimeout = 15000;

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  server.close(async () => {
    try {
      await pool.end();
      clearTimeout(deadline);
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
