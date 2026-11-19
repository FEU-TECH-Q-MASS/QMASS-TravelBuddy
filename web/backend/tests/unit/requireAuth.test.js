const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createRequireAuth,
  createRequireAdmin,
} = require("../../src/middleware/requireAuth");

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function request(token) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {} };
}

function clientFor({ user, userError, profile, profileError }) {
  return {
    auth: { getUser: async () => ({ data: { user }, error: userError }) },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: profile, error: profileError }; },
      };
    },
  };
}

test("requireAuth rejects a missing token", async () => {
  const res = response();
  let called = false;
  await createRequireAuth(clientFor({}))(request(), res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test("requireAuth rejects an invalid token", async () => {
  const res = response();
  await createRequireAuth(clientFor({ userError: new Error("invalid") }))(request("bad"), res, () => {});
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
});

test("requireAuth attaches the verified user", async () => {
  const res = response();
  const req = request("valid");
  let called = false;
  await createRequireAuth(clientFor({ user: { id: "user-1", email: "user@example.com" }, profile: { is_active: true } }))(req, res, () => { called = true; });
  assert.equal(called, true);
  assert.deepEqual(req.user, { id: "user-1", email: "user@example.com" });
});

test("requireAuth rejects a deactivated user", async () => {
  const res = response();
  await createRequireAuth(clientFor({ user: { id: "user-1" }, profile: { is_active: false } }))(request("valid"), res, () => {});
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, "FORBIDDEN");
});

test("requireAdmin rejects a non-admin profile", async () => {
  const res = response();
  const req = { user: { id: "user-1" } };
  await createRequireAdmin(clientFor({ profile: { role: "traveler", is_active: true } }))(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("requireAdmin allows an active admin", async () => {
  const res = response();
  const req = { user: { id: "admin-1" } };
  let called = false;
  await createRequireAdmin(clientFor({ profile: { role: "admin", is_active: true } }))(req, res, () => { called = true; });
  assert.equal(called, true);
});
