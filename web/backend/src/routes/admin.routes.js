const { Router } = require("express");
const { z } = require("zod");
const { getSupabaseClient } = require("../config/supabase");
const { createRequireAuth, createRequireAdmin } = require("../middleware/auth.middleware");
const { createSupportInboxRouter, getSupportMessageCounts } = require("./support.routes");

const pageSize = 50;
const profileFields = "id, display_name, role, is_active";
const roles = z.enum(["traveler", "admin"]);
const directorySchema = z.object({
  page: z.string().regex(/^[1-9]\d*$/).pipe(z.coerce.number().int().max(1000000)).default(1),
  search: z.string().trim().max(254).optional(),
  role: roles.optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
const updateSchema = z.object({
  role: roles.optional(),
  active: z.boolean().optional(),
}).strict().refine(({ role, active }) => role !== undefined || active !== undefined);

function managedUser(profile, account) {
  return {
    id: profile.id,
    name: profile.display_name,
    email: account.email ?? null,
    role: profile.role,
    active: profile.is_active,
    createdAt: account.created_at,
  };
}

async function loadUserPage(client, page, perPage) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage });
  if (error) throw error;

  const accounts = data.users;
  const hasNextPage = data.nextPage != null;
  if (!accounts.length) return { users: [], hasNextPage: false };

  const { data: profiles, error: profileError } = await client
    .from("profiles")
    .select(profileFields)
    .in("id", accounts.map(({ id }) => id));
  if (profileError) throw profileError;

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const users = accounts
    .filter(({ id }) => profilesById.has(id))
    .map((account) => managedUser(profilesById.get(account.id), account));
  return { users, hasNextPage };
}

async function findUsers(client, { page, search, role, status }) {
  const term = search?.toLowerCase();
  const offset = (page - 1) * pageSize;
  const users = [];
  let matched = 0;
  for (let sourcePage = 1; ; sourcePage += 1) {
    const batch = await loadUserPage(client, sourcePage, 200);
    for (const user of batch.users) {
      if (role && user.role !== role) continue;
      if (status && user.active !== (status === "active")) continue;
      if (term && ![user.name, user.email].some((value) => value?.toLowerCase().includes(term))) continue;
      if (matched++ < offset) continue;
      if (users.length === pageSize) return { users, hasNextPage: true };
      users.push(user);
    }
    if (!batch.hasNextPage) return { users, hasNextPage: false };
  }
}

function createAdminRouter(supabaseClient) {
  const router = Router();
  router.use(createRequireAuth(supabaseClient), createRequireAdmin(supabaseClient));
  router.use("/support-messages", createSupportInboxRouter(supabaseClient));

  router.get("/summary", async (_req, res) => {
    const client = supabaseClient || getSupabaseClient();
    const profiles = () => client.from("profiles").select("id", { count: "exact", head: true });
    const now = Date.now();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [newest, admins, active, inactive, newAccounts, supportMessages] = await Promise.all([
      client.from("profiles")
        .select("id, display_name, role, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id")
        .limit(5),
      profiles().eq("role", "admin"),
      profiles().eq("is_active", true),
      profiles().eq("is_active", false),
      profiles().gte("created_at", weekAgo).lte("created_at", new Date(now).toISOString()),
      getSupportMessageCounts(client),
    ]);
    for (const result of [newest, admins, active, inactive, newAccounts]) {
      if (result.error) throw result.error;
    }
    return res.json({
      counts: {
        total: newest.count,
        admins: admins.count,
        active: active.count,
        inactive: inactive.count,
        newAccounts: newAccounts.count,
      },
      supportMessages,
      recentRegistrations: newest.data.map((profile) => ({
        id: profile.id,
        name: profile.display_name,
        role: profile.role,
        createdAt: profile.created_at,
      })),
    });
  });

  router.get("/users", async (req, res) => {
    const filters = directorySchema.safeParse(req.query);
    if (!filters.success) {
      return res.status(400).json({ error: { code: "INVALID_FILTERS", message: "Check the page number and user filters." } });
    }

    const client = supabaseClient || getSupabaseClient();
    const { page, search, role, status } = filters.data;
    return res.json(search || role || status
      ? await findUsers(client, filters.data)
      : await loadUserPage(client, page, pageSize));
  });

  router.patch("/users/:id", async (req, res) => {
    const id = req.params.id.toLowerCase();
    const input = updateSchema.safeParse(req.body);
    if (!z.uuid().safeParse(id).success || !input.success) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Provide a valid user ID and a role or access change." },
      });
    }
    if (id === req.user.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Another admin must change your role or account access." },
      });
    }

    const { role, active } = input.data;
    const changes = {};
    if (role !== undefined) changes.role = role;
    if (active !== undefined) changes.is_active = active;

    const client = supabaseClient || getSupabaseClient();
    const account = await client.auth.admin.getUserById(id);
    if (account.error && account.error.status !== 404) throw account.error;
    if (!account.data?.user) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found." } });
    }

    const { data: profile, error } = await client
      .from("profiles")
      .update(changes)
      .eq("id", id)
      .select(profileFields)
      .maybeSingle();
    if (error) throw error;
    if (!profile) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Profile not found." } });
    }

    return res.json({ user: managedUser(profile, account.data.user) });
  });

  return router;
}

module.exports = { createAdminRouter };
