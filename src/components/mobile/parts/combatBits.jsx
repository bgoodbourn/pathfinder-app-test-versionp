/* Shared combat display components: HP bar + side pill.
 * Color/data helpers live in ./sides.js. */
import { hpColor, sideOf } from "./sides.js";

export function HpBar({ hp, max }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((hp / max) * 100))) : 0;
  return (
    <div className="m-hpbar">
      <span className="m-hpbar-fill" style={{ width: `${pct}%`, background: hpColor(hp, max) }} />
    </div>
  );
}

export function SidePill({ c }) {
  const s = sideOf(c);
  return <span className="m-side-pill" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
}
