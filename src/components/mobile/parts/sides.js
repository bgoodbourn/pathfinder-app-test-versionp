/* Side colors + HP color helpers (data only — kept out of the .jsx so fast
 * refresh stays happy). */
export const SIDE = {
  pc: { accent: "#111", bg: "#f1f0ec", fg: "#111", label: "pc" },
  enemy: { accent: "#b4544a", bg: "#f7ebe9", fg: "#b4544a", label: "enemy" },
  ally: { accent: "#3f7d52", bg: "#e8f0e9", fg: "#3f7d52", label: "ally" },
};
export const sideOf = (c) => SIDE[c.kind] || SIDE.ally;

// green above half, red at/below half, gray at 0
export const hpColor = (hp, max) =>
  hp === 0 ? "#8a8a86" : hp <= max / 2 ? "#b4544a" : "#3f7d52";
