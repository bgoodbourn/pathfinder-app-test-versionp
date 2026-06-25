/* Live-note composer — appends a `note` block to the current page. */
import { useState } from "react";
import { BottomSheet } from "../parts/BottomSheet.jsx";

export function LiveNoteSheet({ campaignName, onAdd, onClose }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    onClose();
  };
  return (
    <BottomSheet title="live note" onClose={onClose}>
      <div className="m-sheet-sub">{(campaignName || "scenario").toLowerCase()}</div>
      <textarea
        className="m-note-input"
        rows={3}
        autoFocus
        placeholder="what just happened at the table…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button className="m-sheet-cta" onClick={add}>add note</button>
    </BottomSheet>
  );
}
