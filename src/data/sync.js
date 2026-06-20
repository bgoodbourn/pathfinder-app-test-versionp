/* ------------------------------------------------------------------ *
 *  Sync — background backup over Supabase. Never in the write path.
 *
 *  Local IndexedDB is always the runtime source of truth. Sync is:
 *    • pull-on-load: adopt the remote blob only if it's newer (updated_at)
 *    • push: debounced after local overlay writes, plus on blur/unload
 *  Last-write-wins by timestamp; no CRDTs (solo use).
 *
 *  Disabled when there's no Supabase env, or when VITE_SYNC === "off"
 *  (use that on dev branches so prod overlays stay untouched).
 * ------------------------------------------------------------------ */
import { remoteEnabled, remoteGetScenario, remoteUpsertScenario, remoteGetOverlay, remoteUpsertOverlay } from "./supabase.js";
import { migrateScenario, migrateOverlay } from "./schema.js";
import {
  getLocalScenario,
  putLocalScenario,
  getLocalOverlay,
  putLocalOverlay,
  setOverlayWriteHook,
  flushOverlayWrites,
} from "./repo.js";

const syncFlag = import.meta.env.VITE_SYNC;
export const syncEnabled = remoteEnabled && syncFlag !== "off";

const newer = (a, b) => new Date(a || 0).getTime() > new Date(b || 0).getTime();

// Pull base scenario from remote and adopt iff strictly newer than local.
// (Base normally flows git -> local via seeding; this is backup recovery.)
export async function pullScenario(id) {
  if (!syncEnabled) return getLocalScenario(id);
  try {
    const [local, remote] = await Promise.all([getLocalScenario(id), remoteGetScenario(id)]);
    if (remote && (!local || newer(remote.updated_at, local.updated_at))) {
      const merged = migrateScenario(remote);
      await putLocalScenario(merged);
      return merged;
    }
    if (local && (!remote || newer(local.updated_at, remote.updated_at))) {
      remoteUpsertScenario(local).catch(() => {});
    }
    return local;
  } catch {
    return getLocalScenario(id);
  }
}

// Pull overlay from remote, adopt iff newer, else push local up.
export async function pullOverlay(id) {
  if (!syncEnabled) return getLocalOverlay(id);
  try {
    const [local, remote] = await Promise.all([getLocalOverlay(id), remoteGetOverlay(id)]);
    if (remote && newer(remote.updated_at, local.updated_at)) {
      const merged = migrateOverlay(remote, id);
      await putLocalOverlay(merged);
      return merged;
    }
    if (newer(local.updated_at, remote?.updated_at)) {
      remoteUpsertOverlay(local).catch(() => {});
    }
    return local;
  } catch {
    return getLocalOverlay(id);
  }
}

// Network-debounced push of overlay writes (on top of repo's local debounce).
let pushTimer = null;
let lastBlob = null;
function schedulePush(blob, ms = 1500) {
  lastBlob = blob;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    const b = lastBlob;
    lastBlob = null;
    if (b) remoteUpsertOverlay(b).catch(() => {});
  }, ms);
}

function flushNow() {
  flushOverlayWrites(); // land pending local writes first
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (lastBlob) {
    const b = lastBlob;
    lastBlob = null;
    remoteUpsertOverlay(b).catch(() => {});
  }
}

let installed = false;
export function initSync() {
  if (!syncEnabled || installed) return;
  installed = true;
  setOverlayWriteHook((blob) => schedulePush(blob));
  if (typeof window !== "undefined") {
    window.addEventListener("blur", flushNow);
    window.addEventListener("beforeunload", flushNow);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushNow();
    });
  }
}
