const app = require("./app");
const { env } = require("./config/env");

const server = app.listen(env.PORT, () => {
  console.log(`TravelBuddy API listening on port ${env.PORT}`);
});

server.on("error", (error) => {
  console.error(`TravelBuddy API could not start: ${error.code || "UNKNOWN_ERROR"}`);
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close());
}
