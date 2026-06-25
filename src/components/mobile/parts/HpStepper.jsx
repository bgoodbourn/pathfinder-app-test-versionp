/* HP controls row: − / editable amount / + stepper, then damage & heal
 * buttons that apply the pending amount (clamping is done by the caller). */
import { haptic } from "./haptic.js";

export function HpStepper({ pending, setPending, onDamage, onHeal }) {
  const dec = () => setPending(Math.max(1, pending - 1));
  const inc = () => setPending(pending + 1);
  return (
    <div className="m-hp-controls">
      <div className="m-hp-step">
        <button className="m-step-btn" onClick={dec} aria-label="less">−</button>
        <input
          className="m-step-amt"
          inputMode="numeric"
          value={pending}
          onChange={(e) => setPending(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value) || 0))}
          aria-label="amount"
        />
        <button className="m-step-btn" onClick={inc} aria-label="more">+</button>
      </div>
      <button className="m-hp-dmg" onClick={() => { haptic(8); onDamage(); }}>damage</button>
      <button className="m-hp-heal" onClick={() => { haptic(8); onHeal(); }}>heal</button>
    </div>
  );
}
