const MEMORY = new Map();

const memoryStorage = {
  getItem(key) {
    return MEMORY.has(key) ? MEMORY.get(key) : null;
  },
  setItem(key, value) {
    MEMORY.set(key, String(value));
  },
  removeItem(key) {
    MEMORY.delete(key);
  },
  clear() {
    MEMORY.clear();
  },
  key(index) {
    return Array.from(MEMORY.keys())[index] ?? null;
  },
  get length() {
    return MEMORY.size;
  },
};

function getStorageBackend(storage) {
  if (storage) {
    return storage;
  }

  if (typeof globalThis !== "undefined" && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return memoryStorage;
}

function normalizeAddress(address) {
  return String(address ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function noteKey(address) {
  return `lead-intel:note:${normalizeAddress(address)}`;
}

const RECENT_SEARCHES_KEY = "lead-intel:recent-searches";

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function loadNotes(address, storage) {
  const backend = getStorageBackend(storage);
  const parsed = parseJson(backend.getItem(noteKey(address)), { notes: "" });
  return typeof parsed.notes === "string" ? parsed.notes : "";
}

export function saveNotes(address, notes, storage) {
  const backend = getStorageBackend(storage);
  backend.setItem(
    noteKey(address),
    JSON.stringify({
      notes,
      updatedAt: new Date().toISOString(),
    }),
  );
  return notes;
}

export function loadRecentSearches(storage) {
  const backend = getStorageBackend(storage);
  const parsed = parseJson(backend.getItem(RECENT_SEARCHES_KEY), []);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((item) => item && typeof item.address === "string")
    .map((item) => ({
      address: item.address,
      savedAt: typeof item.savedAt === "string" ? item.savedAt : null,
    }));
}

export function saveRecentSearch(address, storage) {
  const backend = getStorageBackend(storage);
  const normalized = String(address ?? "").trim();
  if (!normalized) {
    return loadRecentSearches(backend);
  }

  const previous = loadRecentSearches(backend).filter(
    (item) => normalizeAddress(item.address) !== normalizeAddress(normalized),
  );
  const next = [
    { address: normalized, savedAt: new Date().toISOString() },
    ...previous,
  ].slice(0, 8);

  backend.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export function clearLocalLeadIntel(storage) {
  const backend = getStorageBackend(storage);
  backend.clear();
}
