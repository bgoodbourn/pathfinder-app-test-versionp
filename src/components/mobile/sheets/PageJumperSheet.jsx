/* Page jumper — jump within the running order. Forks render indented. */
import { BottomSheet } from "../parts/BottomSheet.jsx";

export function PageJumperSheet({ pages, currentIndex, onPick, onClose }) {
  return (
    <BottomSheet title="running order" onClose={onClose}>
      <div className="m-jumper">
        {pages.length === 0 && <div className="m-empty">no pages yet.</div>}
        {pages.map((p, i) => {
          const fork = p.group === "fork";
          return (
            <button
              key={p.id}
              className={`m-jump-row ${fork ? "fork" : ""} ${i === currentIndex ? "here" : ""}`}
              onClick={() => { onPick(i); onClose(); }}
            >
              <span className="m-jump-title">{(p.title || "untitled").toLowerCase()}</span>
              {i === currentIndex && <span className="m-pill m-pill-dark">here</span>}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
