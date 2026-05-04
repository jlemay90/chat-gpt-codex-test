import cors from "cors";
import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { createLeadStore } from "./db";
import { loadLeadIntelEnv, resolveDatabasePath } from "./env";
import { createLeadsRouter } from "./routes/leads";
import { createLookupRouter } from "./routes/lookup";
import type { LeadIntelEnv } from "./types";

export interface CreateAppOptions {
  env?: Partial<LeadIntelEnv>;
  mockMode?: boolean;
  databaseUrl?: string;
  store?: ReturnType<typeof createLeadStore>;
}

function makeEnv(options: CreateAppOptions): LeadIntelEnv {
  const base = loadLeadIntelEnv(process.env);
  return {
    ...base,
    ...options.env,
    mockMode: options.mockMode ?? options.env?.mockMode ?? base.mockMode,
    databaseUrl: options.databaseUrl ?? options.env?.databaseUrl ?? base.databaseUrl,
  };
}

export function createApp(options: CreateAppOptions = {}): Express {
  const env = makeEnv(options);
  const store = options.store ?? createLeadStore(env.databaseUrl);
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mockMode: env.mockMode,
      databaseUrl: env.databaseUrl,
    });
  });

  app.use("/api", createLookupRouter({ env, store }));
  app.use("/api/leads", createLeadsRouter(store));

  const distPath = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}
