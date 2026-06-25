/* ==================================================================== *
 *  GM notes — shared helpers
 *
 *  Small bits shared between the desktop GmNotes editor and the mobile
 *  Notes screen so a live note written on either surface has the exact
 *  same block shape and timestamp format.
 * ==================================================================== */

// "3:14 pm" — local wall-clock stamp shown on live notes.
export function gmStamp() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

// Canonical live-note block. `id` must be unique within its page.
export function makeNoteBlock(id, text) {
  return { id, type: "note", text, stamp: gmStamp() };
}
