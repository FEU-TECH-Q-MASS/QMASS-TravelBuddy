const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("../../src/app");

test("API returns safe errors for unknown routes and invalid request bodies", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const missing = await fetch(`${base}/api/v1/trips`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, "NOT_FOUND");

  const malformed = await fetch(`${base}/api/v1/health`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{invalid",
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), {
    error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
  });

  const oversized = await fetch(`${base}/api/v1/health`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: "x".repeat(110000) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.code, "PAYLOAD_TOO_LARGE");
});
