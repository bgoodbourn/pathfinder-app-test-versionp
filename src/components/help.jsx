/* ==================================================================== *
 *  CONTEXTUAL HELP — corner "?" pill → per-tab slide-over reference.
 *
 *  Content is pure data keyed by workspace id; the panel renders whatever
 *  the active tab maps to, so adjusting help never touches markup. Feature
 *  numbers (01, 02…) derive from index — they aren't stored.
 * ==================================================================== */
import { useState, useEffect, useCallback, useRef } from "react";

const HELP_CONTENT = {
  scenario: {
    eyebrow: "the official adventure",
    lead: "the scenario as published, brought in to the app in a readable form.",
    features: [
      { t: "sectioned chapters", d: "a breakdown of briefings, general notes, areas, and appendices." },
      { t: "dynamic text", d: "read alouds, stat blocks, rolls are all brought in optimised for readability." },
      { t: "wiki links", d: "tap any highlighted npc, place, or encounter to jump to its wiki entry." },
      { t: "maps gallery", d: "the maps view collects every battle map for the adventure in one place." },
    ],
    foot: "custom campaigns start empty — generate or write your own notes in the gm notes tab.",
  },
  characters: {
    eyebrow: "character manager",
    lead: "details of all player characters and npcs",
    features: [
      { t: "import your players", d: "import player characters direct from pathbuilder and see their character build in full." },
      { t: "manage npcs", d: "see summary and story details, stats where they're available, and make your own per-character notes." },
      { t: "at-a-glance stats", d: "key stats at the top of the sheet." },
    ],
  },
  encounters: {
    eyebrow: "combat manager",
    lead: "run combat end to end — initiative, hit points, conditions and rounds.",
    features: [
      { t: "initiative tracker", d: "auto roll perception for all non player characters and the order will auto sort." },
      { t: "build the field", d: "add players, scenario npcs, creatures from the archives of nethys, or a custom creature." },
      { t: "round bar & log", d: "advance or step back the round and then jot a per-round log as the fight unfolds for any quick round stamp notes on what happened." },
      { t: "threat budget", d: "an xp pill auto-rates the encounter trivial → extreme and xp points, override either field if you like." },
      { t: "conditions", d: "apply conditions per combatant and see their impact on stats." },
      { t: "roll saves", d: "roll saves for any non player character by clicking on the save." },
      { t: "make your own updates", d: "edit creature stats directly or write per combatant notes." },
    ],
  },
  gmnotes: {
    eyebrow: "running sheet",
    lead: "write your session like a binder of pages.",
    features: [
      { t: "prep & run modes", d: "prep mode is fully editable with different block types — run mode locks the text and lets you drop timestamped live notes anywhere you want." },
      { t: "insert blocks", d: "the “+” between lines opens special content formatting for read-aloud boxes, skill checks, q&a tables, and links." },
      { t: "link to anything", d: "drop in an inline link to another page, character card, encounter, or external url." },
      { t: "skill checks with tiers", d: "set a dc and write what happens in each outcome." },
      { t: "structure how you want", d: "drag pages to reorder or create sub-page forks." },
    ],
  },
};

/* The quiet corner trigger — reads as utility chrome, never competing. */
export function HelpCorner({ onClick }) {
  return (
    <button type="button" className="help-corner" onClick={onClick} title="what's this tab?">
      <span className="help-corner-q">?</span>
      <span className="help-corner-label">help</span>
    </button>
  );
}

/* The slide-over reference panel. Owns its exit animation: a "closing" state
 * plays the reverse transition, then a timer fires onClose to unmount. */
export function HelpPanel({ tab, onClose }) {
  const c = HELP_CONTENT[tab];
  const [closing, setClosing] = useState(false);
  const timer = useRef(null);

  const begin = useCallback(() => {
    setClosing(true);
    timer.current = setTimeout(onClose, 260);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") begin(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(timer.current); };
  }, [begin]);

  if (!c) return null;

  return (
    <div className={`help-layer${closing ? " closing" : ""}`}>
      <div className="help-dim" onClick={begin} />
      <aside className="help-panel" role="dialog" aria-modal="true" aria-label="what this tab does">
        <header className="help-head">
          <div className="help-eyebrow">{c.eyebrow}</div>
          <h2 className="help-title">what this tab does</h2>
          <button type="button" className="help-x" onClick={begin} aria-label="close help">✕</button>
        </header>
        <div className="help-body">
          <p className="help-lead">{c.lead}</p>
          {c.features.map((f, i) => (
            <div className="help-feat" key={i}>
              <span className="help-num">{String(i + 1).padStart(2, "0")}</span>
              <div className="help-feat-main">
                <div className="help-feat-t">{f.t}</div>
                <div className="help-feat-d">{f.d}</div>
              </div>
            </div>
          ))}
          {c.foot && <div className="help-foot">{c.foot}</div>}
        </div>
        <footer className="help-footer">{c.features.length} features · tap outside to close</footer>
      </aside>
    </div>
  );
}
