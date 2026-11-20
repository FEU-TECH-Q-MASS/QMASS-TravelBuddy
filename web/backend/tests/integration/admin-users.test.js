const { test } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const { createAdminRouter } = require("../../src/routes/admin.routes");

test("only admins can view account totals, filter users, and persist access changes", async (t) => {
  const adminId = "ad85b8c6-f8d8-4b0e-82b5-4befccb3a90e";
  const travelerId = "3058b64e-d33d-4b18-b6b8-8fc6d5c5f442";
  const createdAt = "2026-11-20T00:00:00.000Z";
  const now = Date.parse(createdAt);
  const daysAgo = (days) => new Date(now - days * 86400000).toISOString();
  t.mock.method(Date, "now", () => now);
  const profiles = new Map([
    [adminId, { id: adminId, display_name: "Admin", role: "admin", is_active: true, created_at: daysAgo(8) }],
    [travelerId, { id: travelerId, display_name: "Traveler", role: "traveler", is_active: true, created_at: daysAgo(1) }],
  ]);
  const accounts = new Map([
    [adminId, { id: adminId, email: "admin@example.com", created_at: createdAt }],
    [travelerId, { id: travelerId, email: "traveler@example.com", created_at: createdAt }],
  ]);
  const supportMessages = [
    { archived_at: null, resolved_at: null },
    { archived_at: null, resolved_at: null },
    { archived_at: null, resolved_at: createdAt },
    { archived_at: createdAt, resolved_at: null },
    { archived_at: createdAt, resolved_at: createdAt },
  ];
  const supabase = {
    auth: {
      getUser: async (id) => ({ data: { user: accounts.get(id) } }),
      admin: {
        async listUsers({ page, perPage }) {
          assert.ok([50, 200].includes(perPage));
          return { data: { users: [accounts.get(page === 1 ? adminId : travelerId)], nextPage: page === 1 ? 2 : null } };
        },
        getUserById: async (id) => ({ data: { user: accounts.get(id) } }),
      },
    },
    from(table) {
      if (table === "support_messages") {
        let rows = supportMessages;
        return {
          select(fields, options) {
            assert.equal(fields, "id");
            assert.deepEqual(options, { count: "exact", head: true });
            return this;
          },
          is(column, value) {
            rows = rows.filter((row) => row[column] === value);
            return this;
          },
          not(column, operator, value) {
            assert.equal(operator, "is");
            rows = rows.filter((row) => row[column] !== value);
            return this;
          },
          then(resolve) { resolve({ count: rows.length }); },
        };
      }
      assert.equal(table, "profiles");
      let id;
      let changes;
      return {
        select(_fields, options) {
          if (!options?.count) return this;
          const rows = [...profiles.values()];
          if (!options.head) {
            return {
              order() { return this; },
              async limit(limit) {
                const data = rows.toSorted((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
                return { count: rows.length, data };
              },
            };
          }
          return {
            async eq(column, value) {
              return { count: rows.filter((row) => row[column] === value).length };
            },
            gte(column, start) {
              assert.equal(column, "created_at");
              return {
                async lte(endColumn, end) {
                  assert.equal(endColumn, "created_at");
                  return { count: rows.filter((row) => row.created_at >= start && row.created_at <= end).length };
                },
              };
            },
          };
        },
        eq(column, value) { assert.equal(column, "id"); id = value; return this; },
        update(value) { changes = value; return this; },
        async in(column, ids) {
          assert.equal(column, "id");
          return { data: ids.map((value) => profiles.get(value)) };
        },
        async maybeSingle() {
          const profile = profiles.get(id);
          if (profile && changes) Object.assign(profile, changes);
          return { data: profile };
        },
      };
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/admin", createAdminRouter(supabase));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  function request(path, token, changes) {
    return fetch(`http://127.0.0.1:${server.address().port}/admin${path}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      method: changes ? "PATCH" : "GET",
      body: changes && JSON.stringify(changes),
    });
  }

  assert.equal((await request("/users", travelerId)).status, 403);
  assert.equal((await request("/summary", travelerId)).status, 403);
  assert.equal((await request(`/users/${adminId}`, travelerId, { active: false })).status, 403);
  assert.equal((await request(`/users/${adminId.toUpperCase()}`, adminId, { role: "traveler" })).status, 403);
  assert.equal((await request("/users?page=invalid", adminId)).status, 400);
  assert.equal((await request("/users?role=owner", adminId)).status, 400);

  const additionalProfiles = [2, 3, 7, 9].map((days) => ({
    id: `registration-${days}`,
    display_name: `New user ${days}`,
    role: "traveler",
    is_active: days !== 9,
    created_at: daysAgo(days),
  }));
  for (const profile of additionalProfiles) profiles.set(profile.id, profile);
  const summary = await request("/summary", adminId);
  assert.deepEqual(await summary.json(), {
    counts: { total: 6, admins: 1, active: 5, inactive: 1, newAccounts: 4 },
    supportMessages: { open: 2, resolved: 1, archived: 2 },
    recentRegistrations: [
      profiles.get(travelerId),
      ...additionalProfiles.slice(0, 3),
      profiles.get(adminId),
    ].map(({ id, display_name, role, created_at }) => ({ id, name: display_name, role, createdAt: created_at })),
  });
  for (const profile of additionalProfiles) profiles.delete(profile.id);

  const firstPage = await request("/users", adminId);
  assert.deepEqual(await firstPage.json(), {
    users: [{ id: adminId, name: "Admin", email: "admin@example.com", role: "admin", active: true, createdAt }],
    hasNextPage: true,
  });

  const traveler = { id: travelerId, name: "Traveler", email: "traveler@example.com", role: "traveler", active: true, createdAt };
  const search = await request("/users?search=TRAVELER%40EXAMPLE.COM&role=traveler&status=active", adminId);
  assert.deepEqual(await search.json(), { users: [traveler], hasNextPage: false });
  const mismatched = await request("/users?search=traveler&role=admin", adminId);
  assert.deepEqual(await mismatched.json(), { users: [], hasNextPage: false });

  const promoted = await request(`/users/${travelerId}`, adminId, { role: "admin" });
  const expectedUser = { ...traveler, role: "admin" };
  assert.deepEqual(await promoted.json(), { user: expectedUser });
  const secondPage = await request("/users?page=2", travelerId);
  assert.deepEqual(await secondPage.json(), { users: [expectedUser], hasNextPage: false });

  assert.equal((await request(`/users/${travelerId}`, adminId, { active: false })).status, 200);
  assert.equal(profiles.get(travelerId).is_active, false);
  assert.equal((await request("/users", travelerId)).status, 403);
  const inactive = await request("/users?status=inactive", adminId);
  assert.deepEqual(await inactive.json(), { users: [{ ...expectedUser, active: false }], hasNextPage: false });
});
