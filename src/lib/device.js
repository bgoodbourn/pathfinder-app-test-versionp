/* ==================================================================== *
 *  Layout detection + override
 *
 *  Decides whether the app boots into the mobile companion UI or the
 *  desktop binder. The override is stored in *plain localStorage* (NOT the
 *  IndexedDB-backed window.storage the data layer uses) so the choice is
 *  readable synchronously at first paint — otherwise the shell would flash
 *  desktop→mobile while IndexedDB resolves.
 *
 *  Precedence (highest wins):
 *    1. persisted override  ("mobile" | "desktop")
 *    2. ?layout= URL param  (also persisted, so emulation reloads stick)
 *    3. device detection     (phones → mobile, everything else → desktop)
 * ==================================================================== */

export const LAYOUT_KEY = "binder:layout-override:v1";

// "auto" | "mobile" | "desktop" — "auto"/absent falls back to detection.
export function getOverride() {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    return v === "mobile" || v === "desktop" ? v : "auto";
  } catch {
    return "auto";
  }
}

export function setOverride(value) {
  try {
    if (value === "mobile" || value === "desktop") localStorage.setItem(LAYOUT_KEY, value);
    else localStorage.removeItem(LAYOUT_KEY); // "auto" clears the override
  } catch {
    /* private mode / storage disabled — fall back to detection each load */
  }
}

// Phones only. iPhone/iPod, or Android phones (Android tablets omit "Mobile"
// in the UA, so they stay desktop). Modern iPadOS reports a Mac UA and is
// intentionally NOT reclassified — iPads keep the desktop binder.
export function detectPhone() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPod/.test(ua)) return true;
  if (/Android/.test(ua) && /Mobile/.test(ua)) return true;
  return false;
}

// Resolve to "mobile" | "desktop". `search` is injectable for testing.
export function resolveLayout({ search } = {}) {
  const qs = search != null ? search : (typeof location !== "undefined" ? location.search : "");
  const param = new URLSearchParams(qs).get("layout");
  if (param === "mobile" || param === "desktop") {
    setOverride(param); // sticky for the testing/emulation session
    return param;
  }
  const override = getOverride();
  if (override === "mobile" || override === "desktop") return override;
  return detectPhone() ? "mobile" : "desktop";
}
