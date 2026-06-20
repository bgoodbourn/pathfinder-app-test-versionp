/* ------------------------------------------------------------------ *
 *  IndexedDB primitives (runtime source of truth)
 *
 *  Three stores, each in its OWN database — idb-keyval's createStore opens a
 *  database at a fixed version and only creates the one store it's given, so
 *  multiple stores must live in separate databases (sharing one DB name would
 *  leave the later stores missing and hang every transaction):
 *    kv         — string key/value, mirrors the old window.storage contract
 *    scenarios  — base scenario blobs keyed by scenario_id (objects)
 *    overlays   — user-overlay blobs keyed by scenario_id (objects)
 *
 *  Stores hold structured-cloneable objects directly (no JSON round-trip)
 *  except `kv`, which keeps string values for window.storage compatibility.
 * ------------------------------------------------------------------ */
import {
  createStore,
  get as idbGet,
  set as idbSet,
  del as idbDel,
  keys as idbKeys,
  entries as idbEntries,
} from "idb-keyval";

export const kvStore = createStore("campaign-binder-kv", "kv");
export const scenarioStore = createStore("campaign-binder-scenarios", "scenarios");
export const overlayStore = createStore("campaign-binder-overlays", "overlays");

export const idb = {
  get: (key, store) => idbGet(key, store),
  set: (key, val, store) => idbSet(key, val, store),
  del: (key, store) => idbDel(key, store),
  keys: (store) => idbKeys(store),
  entries: (store) => idbEntries(store),
};
