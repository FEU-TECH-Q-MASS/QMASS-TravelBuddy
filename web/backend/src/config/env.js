
const path = require("node:path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true,
});

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),

  DUFFEL_ACCESS_TOKEN: z
    .string()
    .startsWith("duffel_test_")
    .optional(),

  DUFFEL_BASE_URL: z
    .string()
    .url()
    .default("https://api.duffel.com"),

  DUFFEL_API_VERSION: z
    .literal("v2")
    .default("v2"),

  DUFFEL_TEST_MODE: z
    .enum(["true", "false"])
    .default("true"),
});

module.exports = {
  envSchema,
  env: envSchema.parse(process.env),
};
