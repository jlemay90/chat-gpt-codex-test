import { Router } from "express";
import { z } from "zod";
import type { LeadStore } from "../types";

const saveLeadSchema = z.object({
  inputAddress: z.string().trim().min(3),
  status: z.enum(["new", "knocked", "not_home", "interested", "follow_up", "sold", "skip"]),
  notes: z.string().trim().max(5000).default(""),
});

const currentQuerySchema = z.object({
  address: z.string().trim().min(3),
});

export function createLeadsRouter(store: LeadStore) {
  const router = Router();

  router.get("/current", async (req, res) => {
    const parsed = currentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid address query" });
    }

    const state = await store.getLeadState(parsed.data.address);
    return res.json({ leadState: state });
  });

  router.get("/history", async (req, res) => {
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.trunc(limitRaw))) : 10;
    const history = await store.listLookupHistory(limit);
    return res.json({ history });
  });

  router.put("/", async (req, res) => {
    const parsed = saveLeadSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid lead payload",
        issues: parsed.error.flatten(),
      });
    }

    const saved = await store.saveLeadState({
      inputAddress: parsed.data.inputAddress,
      status: parsed.data.status,
      notes: parsed.data.notes,
      lastTouchedAt: new Date().toISOString(),
    });

    return res.json({ leadState: saved });
  });

  return router;
}

