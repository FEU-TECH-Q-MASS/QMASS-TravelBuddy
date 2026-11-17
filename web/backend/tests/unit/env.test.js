const { test } = require("node:test");
const assert = require("node:assert/strict");
const { envSchema } = require("../../src/config/env");

test("configuration defaults allow startup without provider credentials", () => {
  assert.deepEqual(envSchema.parse({}), { NODE_ENV: "development", PORT: 5000 });
});

test("configuration rejects invalid ports and environments", () => {
  for (const PORT of ["invalid", "0", "65536", "1.5"]) {
    assert.equal(envSchema.safeParse({ PORT }).success, false);
  }
  assert.equal(envSchema.safeParse({ NODE_ENV: "invalid" }).success, false);
});
