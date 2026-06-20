/* ------------------------------------------------------------------ *
 *  storage adapter — window.storage-compatible string KV over IndexedDB
 *
 *  Mirrors the artifact's window.storage contract (get/set/delete) and
 *  adds list(prefix) so callers can enumerate. The whole app's low-level
 *  persistence funnels through here; the network is never in this path.
 *
 *  On first run it migrates any legacy localStorage `binder:*` keys into
 *  IndexedDB so existing users keep their data after the swap.
 * ------------------------------------------------------------------ */
import { idb, kvStore } from "./idb.js";

export const storage = {
  async get(key) {
    const value = await idb.get(key, kvStore);
    return value == null ? null : { key, value };
  },
  async set(key, value) {
    await idb.set(key, value, kvStore);
    return { key, value };
  },
  async delete(key) {
    await idb.del(key, kvStore);
    return { key, deleted: true };
  },
  async list(prefix = "") {
    const all = await idb.entries(kvStore);
    return all
      .filter(([k]) => typeof k === "string" && k.startsWith(prefix))
      .map(([key, value]) => ({ key, value }));
  },
};

const MIGRATED_FLAG = "binder:migrated:localStorage:v1";

// One-time copy of legacy localStorage binder keys into IndexedDB.
export async function migrateLegacyLocalStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    if (await idb.get(MIGRATED_FLAG, kvStore)) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("binder:")) keys.push(k);
    }
    for (const k of keys) {
      const existing = await idb.get(k, kvStore);
      if (existing == null) await idb.set(k, localStorage.getItem(k), kvStore);
    }
    await idb.set(MIGRATED_FLAG, "1", kvStore);
  } catch {
    /* best effort — never block startup */
  }
}

// Expose the IDB-backed storage as window.storage so any remaining legacy
// callers (and the old artifact code path) transparently use it.
export function installStorage() {
  if (typeof window !== "undefined") window.storage = storage;
}
