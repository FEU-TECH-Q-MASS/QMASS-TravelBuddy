
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { envSchema } = require("../../src/config/env");

test("configuration defaults allow startup without provider credentials", () => {
  const config = envSchema.parse({});

  assert.equal(config.NODE_ENV, "development");
  assert.equal(config.PORT, 5000);

  // Duffel configuration defaults
  assert.equal(
    config.DUFFEL_BASE_URL,
    "https://api.duffel.com"
  );
  assert.equal(config.DUFFEL_API_VERSION, "v2");
  assert.equal(config.DUFFEL_TEST_MODE, "true");

  // A Duffel token should not be required at startup
  assert.equal(config.DUFFEL_ACCESS_TOKEN, undefined);
});

test("configuration rejects invalid ports and environments", () => {
  for (const PORT of ["invalid", "0", "65536", "1.5"]) {
    assert.equal(
      envSchema.safeParse({ PORT }).success,
      false
    );
  }

  assert.equal(
    envSchema.safeParse({ NODE_ENV: "invalid" }).success,
    false
  );
});

test("configuration accepts a Duffel sandbox token", () => {
  const config = envSchema.parse({
    DUFFEL_ACCESS_TOKEN: "duffel_test_example",
  });

  assert.equal(
    config.DUFFEL_ACCESS_TOKEN,
    "duffel_test_example"
  );
});

test("configuration rejects non-sandbox Duffel tokens", () => {
  const result = envSchema.safeParse({
    DUFFEL_ACCESS_TOKEN: "duffel_live_example",
  });

  assert.equal(result.success, false);
});
