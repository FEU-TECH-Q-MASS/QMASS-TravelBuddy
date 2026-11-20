const { Router } = require("express");
const { z } = require("zod");
const { topics, validateContact } = require("../../../contact-validation.cjs");
const { getSupabaseClient } = require("../config/supabase");

const fields = "id, name, email, topic, message, created_at, resolved_at, archived_at";
const filters = z.object({
  view: z.enum(["inbox", "archived"]).default("inbox"),
  status: z.enum(["open", "resolved"]).optional(),
  topic: z.enum(topics).optional(),
  search: z.string().trim().max(254).optional(),
  page: z.string().regex(/^[1-9]\d{0,5}$/).transform(Number).default(1),
  pageSize: z.enum(["5", "10", "20"]).transform(Number).default(20),
});

function filterMessageStatus(query, view, status) {
  if (view === "archived") query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  if (status === "open") return query.is("resolved_at", null);
  if (status === "resolved") return query.not("resolved_at", "is", null);
  return query;
}

async function getSupportMessageCounts(client) {
  const count = (view, status) => filterMessageStatus(
    client.from("support_messages").select("id", { count: "exact", head: true }),
    view, status,
  );
  const [open, resolved, archived] = await Promise.all([
    count("inbox", "open"),
    count("inbox", "resolved"),
    count("archived"),
  ]);
  for (const result of [open, resolved, archived]) {
    if (result.error) throw result.error;
  }
  return { open: open.count, resolved: resolved.count, archived: archived.count };
}

function createContactRouter(supabaseClient) {
  const router = Router();
  router.post("/", async (req, res) => {
    const { values, errors } = validateContact(req.body);
    const id = z.uuid().safeParse(req.body?.id);
    if (!id.success || Object.keys(errors).length) {
      return res.status(400).json({ error: { message: "Check your submission and try again.", fields: errors } });
    }

    const client = supabaseClient || getSupabaseClient();
    const { data, error } = await client.rpc("submit_support_message", {
      submission_id: id.data,
      sender_name: values.name,
      sender_email: values.email,
      message_topic: values.topic,
      message_body: values.message,
    });
    if (error) throw error;
    if (data === "rate_limited") {
      return res.status(429).json({ error: { message: "This email has reached the submission limit. Try again later." } });
    }
    if (data === "conflict") {
      return res.status(409).json({ error: { message: "This submission has changed. Please try again." } });
    }
    if (data !== "accepted") throw new Error("Unexpected contact submission result.");
    return res.status(201).json({ received: true });
  });
  return router;
}

function createSupportInboxRouter(supabaseClient) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  router.get("/", async (req, res) => {
    const input = filters.safeParse(req.query);
    if (!input.success) return res.status(400).json({ error: { message: "Check the inbox filters." } });

    const { view, status, topic, search, page, pageSize } = input.data;
    const client = supabaseClient || getSupabaseClient();

    function filterMessages(query) {
      query = filterMessageStatus(query, view, status);
      if (topic) query = query.eq("topic", topic);
      if (search) query = query.ilike("sender_search", "%" + search.replace(/[\\%_*]/g, "\\$&") + "%");
      return query;
    }

    const offset = (page - 1) * pageSize;
    const query = filterMessages(client.from("support_messages").select(fields, { count: "exact" }));
    const { data, count, error } = await query.order("created_at", { ascending: false })
      .order("id", { ascending: false }).range(offset, offset + pageSize - 1);
    if (page > 1 && error?.code === "PGRST103") {
      const total = await filterMessages(client.from("support_messages").select("id", { count: "exact", head: true }));
      if (total.error) throw total.error;
      return res.json({ messages: [], total: total.count, pageSize });
    }
    if (error) throw error;
    return res.json({ messages: data, total: count, pageSize });
  });

  router.patch("/:id", async (req, res) => {
    const id = z.uuid().safeParse(req.params.id);
    const action = z.enum(["resolve", "archive", "restore"]).safeParse(req.body?.action);
    if (!id.success || !action.success) return res.status(400).json({ error: { message: "Invalid message or action." } });

    const client = supabaseClient || getSupabaseClient();
    const table = client.from("support_messages");
    const now = new Date().toISOString();
    let query;
    if (action.data === "resolve") {
      query = table.update({ resolved_at: now, resolved_by: req.user.id })
        .is("archived_at", null).is("resolved_at", null);
    } else if (action.data === "archive") {
      query = table.update({ archived_at: now, archived_by: req.user.id }).is("archived_at", null);
    } else {
      query = table.update({ archived_at: null, archived_by: null }).not("archived_at", "is", null);
    }

    const { data, error } = await query.eq("id", id.data).select(fields).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(409).json({ error: { message: "This message changed or is unavailable. Refresh the inbox." } });
    return res.json({ message: data });
  });
  return router;
}

module.exports = { createContactRouter, createSupportInboxRouter, getSupportMessageCounts };
