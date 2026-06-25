/* Scenario picker — switch the active session. */
import { BottomSheet } from "../parts/BottomSheet.jsx";

export function ScenarioPickerSheet({ scenarios, activeId, onPick, onClose }) {
  return (
    <BottomSheet title="scenarios" onClose={onClose}>
      <div className="m-sheet-sub">switch session</div>
      <div className="m-scen-list">
        {scenarios.map((s) => (
          <button
            key={s.scenario_id}
            className={`m-scen-row ${s.scenario_id === activeId ? "current" : ""}`}
            onClick={() => { onPick(s.scenario_id); onClose(); }}
          >
            <span className="m-scen-name">{(s.title || "untitled").toLowerCase()}</span>
            {s.scenario_id === activeId && <span className="m-pill m-pill-dark">current</span>}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
