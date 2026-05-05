import { createApp } from "./app";
import { loadLeadIntelEnv } from "./env";

const env = loadLeadIntelEnv(process.env);
const app = createApp({
  env,
  mockMode: env.mockMode,
  databaseUrl: env.databaseUrl,
});

app.listen(env.serverPort, "0.0.0.0", () => {
  console.log(`Lead Intel API running on http://0.0.0.0:${env.serverPort}`);
});

