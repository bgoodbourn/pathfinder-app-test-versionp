/* ------------------------------------------------------------------ *
 *  Local repository (IndexedDB-backed)
 *
 *  Base scenarios: seeded from the bundled /scenarios/*.json (git = source
 *  of truth). Re-seeded only when the bundled `rev` differs from what's
 *  stored, so regeneration updates the base in place without clobbering
 *  the user overlay.
 *
 *  Overlays: per scenario_id, the user's editable state. Saved through a
 *  debounced writer so rapid edits don't thrash IndexedDB.
 * ------------------------------------------------------------------ */
import { idb, scenarioStore, overlayStore } from "./idb.js";
import { migrateScenario, migrateOverlay, emptyOverlay, isoNow, SCHEMA_VERSION } from "./schema.js";

const BASE = import.meta.env.BASE_URL || "/";

async function fetchJson(relPath) {
  const res = await fetch(`${BASE}${relPath}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`fetch ${relPath} -> ${res.status}`);
  return res.json();
}

// Ensure every bundled scenario is present and current in IndexedDB.
// Returns the manifest [{ scenario_id, title, rev }].
export async function seedBundledScenarios() {
  let manifest;
  try {
    manifest = await fetchJson("scenarios/index.json");
  } catch {
    return []; // offline with nothing bundled-fetchable; rely on what's stored
  }
  for (const entry of manifest) {
    try {
      const stored = await idb.get(entry.scenario_id, scenarioStore);
      if (stored && stored.rev === entry.rev) continue; // up to date
      const blob = migrateScenario(await fetchJson(`scenarios/${entry.scenario_id}.json`));
      if (blob) {
        blob.updated_at = blob.updated_at || isoNow();
        await idb.set(entry.scenario_id, blob, scenarioStore);
      }
    } catch {
      /* keep whatever is already stored for this scenario */
    }
  }
  return manifest;
}

export async function listLocalScenarios() {
  const entries = await idb.entries(scenarioStore);
  return entries
    .map(([, b]) => b)
    .filter(Boolean)
    .map((b) => ({ scenario_id: b.scenario_id, title: b.title }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getLocalScenario(id) {
  return migrateScenario(await idb.get(id, scenarioStore));
}

export async function putLocalScenario(blob) {
  await idb.set(blob.scenario_id, blob, scenarioStore);
}

export async function getLocalOverlay(id) {
  const stored = await idb.get(id, overlayStore);
  return stored ? migrateOverlay(stored, id) : emptyOverlay(id);
}

export async function putLocalOverlay(blob) {
  await idb.set(blob.scenario_id, blob, overlayStore);
}

// Debounced overlay writer (per scenario). Stamps updated_at on write and
// retains the latest pending blob so flush can persist it on blur/unload.
const pending = new Map(); // scenarioId -> { timer, blob }

function commit(scenarioId) {
  const p = pending.get(scenarioId);
  if (!p) return;
  clearTimeout(p.timer);
  pending.delete(scenarioId);
  putLocalOverlay(p.blob);
  onOverlayWrite?.(p.blob);
}

export function saveOverlayDebounced(scenarioId, body, ms = 500) {
  const blob = {
    scenario_id: scenarioId,
    schema_version: SCHEMA_VERSION,
    updated_at: isoNow(),
    overlay: body,
  };
  const prev = pending.get(scenarioId);
  if (prev) clearTimeout(prev.timer);
  const timer = setTimeout(() => commit(scenarioId), ms);
  pending.set(scenarioId, { timer, blob });
  return blob;
}

// Sync layer hook: notified after an overlay write lands locally.
let onOverlayWrite = null;
export function setOverlayWriteHook(fn) {
  onOverlayWrite = fn;
}

// Force any pending debounced overlay writes to persist now (blur/unload).
export function flushOverlayWrites() {
  for (const id of [...pending.keys()]) commit(id);
}
