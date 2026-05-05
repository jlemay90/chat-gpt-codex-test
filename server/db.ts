import Database from "better-sqlite3";
import type { LeadIntelResult, LeadStatus, LeadStateRecord } from "../shared/leadIntel";
import { resolveDatabasePath } from "./env";
import type { LeadStore } from "./types";

type DatabaseInstance = Database.Database;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeKey(address: string): string {
  return address.trim().toLowerCase();
}

function openDatabase(databaseUrl: string): DatabaseInstance {
  const resolved = resolveDatabasePath(databaseUrl);
  const db = new Database(resolved === ":memory:" ? resolved : resolved, {
    fileMustExist: false,
  });

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS lead_current (
      address_key TEXT PRIMARY KEY,
      input_address TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT NOT NULL,
      last_touched_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lead_lookup_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address_key TEXT NOT NULL,
      input_address TEXT NOT NULL,
      looked_up_at TEXT NOT NULL,
      score INTEGER,
      grade TEXT,
      result_json TEXT NOT NULL
    );
  `);

  return db;
}

function rowToState(row: Record<string, unknown> | undefined): LeadStateRecord | null {
  if (!row) return null;
  return {
    inputAddress: String(row.input_address ?? ""),
    status: String(row.status ?? "new") as LeadStatus,
    notes: String(row.notes ?? ""),
    lastTouchedAt: (row.last_touched_at as string | null) ?? null,
  };
}

export function createLeadStore(databaseUrl: string): LeadStore {
  const db = openDatabase(databaseUrl);

  return {
    async saveLeadState(input) {
      const addressKey = normalizeKey(input.inputAddress);
      const lastTouchedAt = input.lastTouchedAt ?? nowIso();
      const statement = db.prepare(`
        INSERT INTO lead_current (address_key, input_address, status, notes, last_touched_at, updated_at)
        VALUES (@addressKey, @inputAddress, @status, @notes, @lastTouchedAt, @updatedAt)
        ON CONFLICT(address_key) DO UPDATE SET
          input_address = excluded.input_address,
          status = excluded.status,
          notes = excluded.notes,
          last_touched_at = excluded.last_touched_at,
          updated_at = excluded.updated_at
      `);
      statement.run({
        addressKey,
        inputAddress: input.inputAddress,
        status: input.status,
        notes: input.notes,
        lastTouchedAt,
        updatedAt: nowIso(),
      });

      return {
        inputAddress: input.inputAddress,
        status: input.status,
        notes: input.notes,
        lastTouchedAt,
      };
    },

    async getLeadState(address) {
      const row = db
        .prepare("SELECT input_address, status, notes, last_touched_at FROM lead_current WHERE address_key = ?")
        .get(normalizeKey(address)) as Record<string, unknown> | undefined;

      return rowToState(row);
    },

    async listLookupHistory(limit = 10) {
      const rows = db
        .prepare(
          "SELECT input_address, looked_up_at, score, grade FROM lead_lookup_history ORDER BY looked_up_at DESC, id DESC LIMIT ?",
        )
        .all(limit) as Array<Record<string, unknown>>;

      return rows.map((row) => ({
        inputAddress: String(row.input_address ?? ""),
        status: "new" as LeadStatus,
        notes: "",
        lastTouchedAt: row.looked_up_at as string,
        score: typeof row.score === "number" ? row.score : null,
        grade: typeof row.grade === "string" ? row.grade : null,
        lookedUpAt: String(row.looked_up_at ?? nowIso()),
      }));
    },

    async recordLookup(result: LeadIntelResult) {
      const addressKey = normalizeKey(result.inputAddress);
      const lookedUpAt = nowIso();
      db.prepare(
        `
        INSERT INTO lead_lookup_history (address_key, input_address, looked_up_at, score, grade, result_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      ).run(
        addressKey,
        result.inputAddress,
        lookedUpAt,
        result.leadScore.score,
        result.leadScore.grade,
        JSON.stringify(result),
      );

      const current = db
        .prepare("SELECT status, notes, last_touched_at FROM lead_current WHERE address_key = ?")
        .get(addressKey) as Record<string, unknown> | undefined;

      const status = (current?.status as LeadStatus | undefined) ?? result.userNotes.status;
      const notes = String(current?.notes ?? result.userNotes.notes ?? "");
      const lastTouchedAt = (current?.last_touched_at as string | null) ?? lookedUpAt;

      db.prepare(`
        INSERT INTO lead_current (address_key, input_address, status, notes, last_touched_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(address_key) DO UPDATE SET
          input_address = excluded.input_address,
          last_touched_at = excluded.last_touched_at,
          updated_at = excluded.updated_at
      `).run(
        addressKey,
        result.inputAddress,
        status,
        notes,
        lastTouchedAt,
        lookedUpAt,
      );
    },
  };
}

