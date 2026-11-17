const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const app = require("../../src/app");

test("GET /api/v1/health exposes only the documented liveness contract", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal(response.headers.has("x-powered-by"), false);
  assert.deepEqual(await response.json(), { status: "ok", service: "travelbuddy-api", version: "v1" });
});
