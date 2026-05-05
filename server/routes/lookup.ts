import { Router } from "express";
import { z } from "zod";
import { lookupLeadIntel } from "../adapters";
import type { LeadIntelEnv, LeadStore } from "../types";

const lookupSchema = z.object({
  address: z.string().trim().min(3),
  zip: z.string().trim().optional(),
});

export function createLookupRouter(options: { env: LeadIntelEnv; store: LeadStore }) {
  const router = Router();

  router.post("/lookup", async (req, res) => {
    const parsed = lookupSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid lookup payload",
        issues: parsed.error.flatten(),
      });
    }

    const result = await lookupLeadIntel(parsed.data, options.env);
    const existing = await options.store.getLeadState(result.inputAddress);
    result.userNotes = existing
      ? {
          status: existing.status,
          notes: existing.notes,
          lastTouchedAt: existing.lastTouchedAt,
        }
      : result.userNotes;

    await options.store.recordLookup(result);

    return res.json(result);
  });

  return router;
}

