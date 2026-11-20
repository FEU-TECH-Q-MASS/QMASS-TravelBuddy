const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const { createAdminRouter } = require("../../src/routes/admin.routes");
const { createContactRouter } = require("../../src/routes/support.routes");

test("contact submissions reach the admin inbox and retain resolution after restore", async (context) => {
  const id = "729f8981-db3d-4d63-98b5-40fceaaef34c";
  let message;
  let submissionResult = "accepted";
  const client = {
    auth: { getUser: async (token) => ({ data: { user: { id: token } } }) },
    async rpc(name, fields) {
      assert.equal(name, "submit_support_message");
      if (submissionResult === "accepted") {
        message ??= {
          id: fields.submission_id, name: fields.sender_name, email: fields.sender_email,
          topic: fields.message_topic, message: fields.message_body, archived_at: null, resolved_at: null,
        };
      }
      return { data: submissionResult };
    },
    from(table) {
      let match = true;
      let changes;
      let userId;
      let countOnly;
      return {
        select(_fields, options) { countOnly = options?.head; return this; },
        order() { return this; },
        eq(key, value) {
          if (table === "profiles") userId = value;
          else match &&= message?.[key] === value;
          return this;
        },
        is(key, value) { match &&= message?.[key] === value; return this; },
        not(key, operator, value) {
          assert.equal(operator, "is");
          match &&= message?.[key] !== value;
          return this;
        },
        ilike(key, pattern) {
          assert.equal(key, "sender_search");
          assert.equal(pattern, "%example.org%");
          return this;
        },
        update(value) { changes = value; return this; },
        async range(from, to) {
          const size = to - from + 1;
          assert.ok([5, 10, 20].includes(size));
          if (from > 0) {
            assert.equal(from, 2 * size);
            return { error: { code: "PGRST103" } };
          }
          return { data: match && from === 0 ? [message] : [], count: Number(match) };
        },
        then(resolve) {
          assert.equal(countOnly, true);
          resolve({ count: Number(match) });
        },
        async maybeSingle() {
          if (table === "profiles") {
            return { data: { role: userId === "admin" ? "admin" : "traveler", is_active: true } };
          }
          return { data: match ? Object.assign(message, changes) : null };
        },
      };
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/contact", createContactRouter(client));
  app.use("/admin", createAdminRouter(client));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const request = (path, { token, method = "GET", body } = {}) => fetch(
    "http://127.0.0.1:" + server.address().port + path,
    {
      method, body: body && JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...(token && { Authorization: "Bearer " + token }) },
    },
  );

  const payload = {
    id, name: "  Test Sender  ", email: " SENDER@example.org ",
    topic: "General question", message: "  Can I use day/night filters?\nThank you.  ",
  };
  const invalid = await request("/contact", { method: "POST", body: { ...payload, topic: "Unknown", message: "  " } });
  assert.equal(invalid.status, 400);
  assert.deepEqual(Object.keys((await invalid.json()).error.fields), ["topic", "message"]);
  assert.equal(message, undefined);

  const accepted = await request("/contact", { method: "POST", body: payload });
  assert.equal(accepted.status, 201);
  assert.deepEqual(await accepted.json(), { received: true });
  assert.equal(message.email, "sender@example.org");
  assert.equal(message.message, "Can I use day/night filters?\nThank you.");
  submissionResult = "rate_limited";
  assert.equal((await request("/contact", { method: "POST", body: payload })).status, 429);

  const inbox = "/admin/support-messages";
  const list = async (query = "") => {
    const response = await request(inbox + query, { token: "admin" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    return (await response.json()).messages;
  };
  const change = (action, token = "admin") =>
    request(inbox + "/" + id, { method: "PATCH", token, body: { action } });

  assert.equal((await request(inbox)).status, 401);
  assert.equal((await request(inbox, { token: "traveler" })).status, 403);
  assert.equal((await change("archive", "traveler")).status, 403);
  assert.equal((await request(inbox + "?pageSize=100", { token: "admin" })).status, 400);
  for (const pageSize of [5, 10, 20]) {
    const response = await request(inbox + "?pageSize=" + pageSize, { token: "admin" });
    assert.deepEqual(await response.json(), { messages: [message], total: 1, pageSize });
  }
  const outOfRange = await request(inbox + "?page=3&pageSize=5&status=open", { token: "admin" });
  assert.deepEqual(await outOfRange.json(), { messages: [], total: 1, pageSize: 5 });
  const noMatches = await request(inbox + "?page=3&pageSize=5&status=resolved", { token: "admin" });
  assert.deepEqual(await noMatches.json(), { messages: [], total: 0, pageSize: 5 });
  assert.equal((await list("?status=open&topic=General+question&search=example.org")).length, 1);
  assert.equal((await change("resolve")).status, 200);
  const resolvedAt = message.resolved_at;
  assert.ok(resolvedAt);
  assert.equal((await list("?status=open")).length, 0);
  assert.equal((await change("archive")).status, 200);
  assert.equal((await list()).length, 0);
  assert.equal((await list("?view=archived&status=resolved")).length, 1);
  assert.equal((await change("resolve")).status, 409);
  assert.equal((await change("restore")).status, 200);
  assert.equal((await list("?status=resolved"))[0].resolved_at, resolvedAt);
  assert.equal((await list("?view=archived")).length, 0);
});
