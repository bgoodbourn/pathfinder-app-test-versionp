/* Condition chips with add-picker + drag-to-set-value gesture.
 * Reuses the real CONDITIONS / VALUED tables and combatant condition shape
 * { id, name, value }. ~20px of vertical drag = one step, clamped 1–9. */
import { useState, useRef } from "react";
import { CONDITIONS, VALUED, conditionTip } from "../../../lib/conditions.js";
import { haptic } from "./haptic.js";
import { IconClose, IconPlus } from "./MobileIcons.jsx";

function ValueChip({ cond, onRemove, onSetValue }) {
  const drag = useRef(null);
  const valued = cond.value != null;

  const onDown = (e) => {
    if (!valued) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    drag.current = { startY: e.clientY, startVal: cond.value, lastVal: cond.value };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const steps = Math.round((d.startY - e.clientY) / 20);
    const nv = Math.max(1, Math.min(9, d.startVal + steps));
    if (nv !== d.lastVal) { d.lastVal = nv; haptic(6); onSetValue(cond.id, nv); }
  };
  const onUp = () => { drag.current = null; };

  return (
    <span
      className={`m-cond-chip ${valued ? "valued" : ""}`}
      title={conditionTip(cond)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{ touchAction: valued ? "none" : "auto" }}
    >
      {cond.name}{valued ? ` ${cond.value}` : ""}
      {valued && <span className="m-cond-updown">↕</span>}
      <button className="m-cond-x" onClick={() => onRemove(cond.id)} aria-label={`remove ${cond.name}`}>
        <IconClose size={12} />
      </button>
    </span>
  );
}

export function ConditionChips({ conditions = [], onAdd, onRemove, onSetValue }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const applied = new Set(conditions.map((c) => c.name));
  const options = CONDITIONS.filter((n) => !applied.has(n));

  return (
    <div className="m-conds">
      <div className="m-conds-row">
        {conditions.map((c) => (
          <ValueChip key={c.id} cond={c} onRemove={onRemove} onSetValue={onSetValue} />
        ))}
        <button className="m-cond-add" onClick={() => setMenuOpen((v) => !v)}>
          <IconPlus size={13} /> condition
        </button>
      </div>
      {conditions.some((c) => c.value != null) && (
        <div className="m-conds-hint">drag a value ↕ to adjust</div>
      )}
      {menuOpen && (
        <div className="m-condmenu">
          {options.map((n) => (
            <button
              key={n}
              className="m-condmenu-item"
              onClick={() => { haptic(8); onAdd(n, VALUED.has(n)); setMenuOpen(false); }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
