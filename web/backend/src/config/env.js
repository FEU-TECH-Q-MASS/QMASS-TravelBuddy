const path = require("node:path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
});

module.exports = { envSchema, env: envSchema.parse(process.env) };
