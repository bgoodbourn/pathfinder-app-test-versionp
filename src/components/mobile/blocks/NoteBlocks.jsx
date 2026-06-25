/* ==================================================================== *
 *  NoteBlocks — read-only mobile renderers for gmPages block types
 *
 *  The desktop GmNotes is a full editor; at the table on a phone we only
 *  need to READ the running order and append live notes. These map each
 *  block shape ({heading,p,read,check,qa,links,note}) to a phone card.
 * ==================================================================== */
import { useState } from "react";
import { IconChevDown, IconLink } from "../parts/MobileIcons.jsx";

const linkColor = (t) =>
  t === "npc" ? "oklch(0.6 0.13 32)"
  : t === "enc" ? "#b4544a"
  : t === "url" ? "oklch(0.6 0.13 250)"
  : "#111"; // page / default

function Collapsible({ title, pill, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="m-card m-collapse">
      <button className="m-collapse-head" onClick={() => setOpen((v) => !v)}>
        <span className="m-collapse-title">{title}</span>
        {pill != null && <span className="m-pill m-pill-dark">{pill}</span>}
        <span className="m-collapse-chev" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <IconChevDown size={15} />
        </span>
      </button>
      {open && <div className="m-collapse-body">{children}</div>}
    </div>
  );
}

function CheckBlock({ b }) {
  const title = b.skill ? b.skill.toLowerCase() : "skill check";
  return (
    <Collapsible title={title} pill={b.dc ? `dc ${b.dc}` : null} defaultOpen>
      {(b.tiers || []).filter((t) => t.text).map((t, i) => (
        <div className="m-tier" key={i}>
          <span className="m-tier-label">{t.label}</span>
          <span className="m-tier-text">{t.text}</span>
        </div>
      ))}
    </Collapsible>
  );
}

function QaBlock({ b }) {
  const rows = (b.rows || []).filter((r) => r.q || r.a);
  return (
    <Collapsible title={(b.qaTitle || "if the players ask…").toLowerCase()} pill={rows.length || null}>
      {rows.map((r, i) => (
        <div className="m-qa-row" key={i}>
          <div className="m-qa-q">{r.q}</div>
          <div className="m-qa-a">{r.a}</div>
        </div>
      ))}
    </Collapsible>
  );
}

function LinksBlock({ b, onOpenNpc, onOpenEncounter, onGoPage }) {
  const items = b.items || [];
  if (!items.length) return null;
  const tap = (it) => {
    if (it.type === "npc") onOpenNpc && onOpenNpc(it.refId);
    else if (it.type === "enc") onOpenEncounter && onOpenEncounter(it.refId);
    else if (it.type === "page") onGoPage && onGoPage(it.refId);
    else if (it.type === "url" && it.url) window.open(it.url, "_blank", "noopener");
  };
  return (
    <Collapsible title="linked" pill={items.length}>
      <div className="m-chips">
        {items.map((it, i) => (
          <button className="m-chip" key={i} onClick={() => tap(it)}>
            <span className="m-chip-dot" style={{ background: linkColor(it.type) }} />
            {it.name}
            {it.type === "url" && <IconLink size={12} />}
          </button>
        ))}
      </div>
    </Collapsible>
  );
}

// Render one gmPages block. Read-aloud and live notes render inline (not
// collapsible); checks/qa/links are collapsible cards.
export function NoteBlock({ block: b, onOpenNpc, onOpenEncounter, onGoPage }) {
  switch (b.type) {
    case "heading":
      return b.text ? <h3 className="m-block-h">{b.text}</h3> : null;
    case "p":
      return b.text ? <p className="m-block-p">{b.text}</p> : null;
    case "read":
      return b.text ? (
        <div className="m-readaloud">
          <span className="m-pill m-pill-read">read aloud</span>
          <p>{b.text}</p>
        </div>
      ) : null;
    case "check":
      return <CheckBlock b={b} />;
    case "qa":
      return <QaBlock b={b} />;
    case "links":
      return <LinksBlock b={b} onOpenNpc={onOpenNpc} onOpenEncounter={onOpenEncounter} onGoPage={onGoPage} />;
    case "note":
      return (
        <div className="m-livenote">
          <span className="m-pill m-pill-live">live note</span>
          <span className="m-livenote-text">{b.text}</span>
          {b.stamp && <span className="m-livenote-stamp">{b.stamp}</span>}
        </div>
      );
    default:
      return null;
  }
}
