import assert from "node:assert/strict";
import test from "node:test";
import {
  loadNotes,
  loadRecentSearches,
  saveNotes,
  saveRecentSearch,
} from "../src/lib/storage.js";

function createFakeStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

test("saveNotes and loadNotes round-trip a note for one address", () => {
  const storage = createFakeStorage();

  saveNotes("101 Knock St, Franklin, TN 37064", "Call after 6 PM", storage);
  assert.equal(loadNotes("101 Knock St, Franklin, TN 37064", storage), "Call after 6 PM");
});

test("saveRecentSearch keeps the newest address first and deduplicates entries", () => {
  const storage = createFakeStorage();

  saveRecentSearch("101 Knock St, Franklin, TN 37064", storage);
  saveRecentSearch("202 Rental Ln, Nashville, TN 37211", storage);
  saveRecentSearch("101 Knock St, Franklin, TN 37064", storage);

  const recent = loadRecentSearches(storage);
  assert.equal(recent.length, 2);
  assert.equal(recent[0].address, "101 Knock St, Franklin, TN 37064");
  assert.equal(recent[1].address, "202 Rental Ln, Nashville, TN 37211");
});
