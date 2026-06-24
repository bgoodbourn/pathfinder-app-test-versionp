/* ==================================================================== *
 *  Scenario workspace components
 *
 *  The published-scenario reader: PathfinderWiki auto-linking rich text, the
 *  block renderer for each content type (read-aloud, checks, encounters,
 *  hazards, call-outs…), the maps view with clickable pins, and the top-level
 *  ScenarioView that picks content for the active section. Only ScenarioView
 *  is consumed outside this module.
 * ==================================================================== */
import { createContext, useContext } from "react";
import { useScenarioData } from "../data/ScenarioContext.jsx";
import { Severity, Pict, ScenSym, TierMark } from "./icons.jsx";

/* ------------------------------------------------------------------ *
 *  PathfinderWiki links
 *  Each term -> the page title on pathfinderwiki.com (verified to exist).
 *  Only the FIRST occurrence of a term per section is linked, so the
 *  page stays readable. Links render bold with a faint dotted underline:
 *  visible, but quiet enough not to fight the prose.
 *
 *  WIKI base + LINKS load at runtime; the link lookup/regex for the active
 *  scenario are built in ScenarioContext and handed down through LinkScope.
 * ------------------------------------------------------------------ */

// Carries the active scenario's link maps ({ lookup, re, wiki }) down to
// RichText. The per-block `seen` set lives inside RichText (a local, so render
// stays pure — mutating shared state during render breaks under StrictMode).
const LinkScope = createContext(null);

function linkify(text, links, seen, keyer) {
  if (!text || !links || !links.re) return [text];
  const { lookup, wiki } = links;
  // Clone the regex per call: links.re is shared/memoized and stateful (the /g
  // flag tracks lastIndex), so reusing it directly corrupts matching.
  const re = new RegExp(links.re.source, links.re.flags);
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    const matched = m[0];
    const canon = lookup[matched.toLowerCase()];
    if (!canon || seen.has(canon)) continue; // leave repeats as plain text
    seen.add(canon);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <a
        key={keyer()}
        className="wlink"
        href={wiki + canon}
        target="_blank"
        rel="noopener noreferrer"
      >
        {matched}
      </a>
    );
    last = m.index + matched.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

function RichText({ x }) {
  // supports **bold**, *italic*, and PathfinderWiki auto-links
  const links = useContext(LinkScope);
  const seen = new Set(); // local to this block; keeps render pure under StrictMode
  let key = 0;
  const keyer = () => "k" + key++;
  const nodes = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(x)) !== null) {
    if (m.index > last) nodes.push(...linkify(x.slice(last, m.index), links, seen, keyer));
    const token = m[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={keyer()}>{linkify(token.slice(2, -2), links, seen, keyer)}</strong>);
    } else {
      nodes.push(<em key={keyer()}>{linkify(token.slice(1, -1), links, seen, keyer)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < x.length) nodes.push(...linkify(x.slice(last), links, seen, keyer));
  return <>{nodes}</>;
}

const CALL_LABEL = {
  dev: "Development",
  hero: "Hero Points",
  reward: "Reward",
  note: "Note",
  hazard: "Caution",
};
const CALL_PICT = { dev: "dev", hero: "hero", reward: "reward", note: "note" };
const TIER_LABEL = {
  "crit-success": "Critical Success",
  success: "Success",
  fail: "Failure",
  "crit-fail": "Critical Failure",
};

function ScenarioBlock({ b }) {
  switch (b.t) {
    case "h":
      return (
        <h3 className="sec-h">
          <RichText x={b.x} />
          <Severity threat={b.threat} />
        </h3>
      );
    case "p":
      return (
        <p className="sec-p">
          <RichText x={b.x} />
        </p>
      );
    case "list":
      return (
        <ul className="sec-list">
          {b.items.map((it, i) => (
            <li key={i}>
              <RichText x={it} />
            </li>
          ))}
        </ul>
      );
    case "read":
      return (
        <figure className="read">
          <span className="read-tab">
            <Pict name="read" /> read aloud
          </span>
          {b.x.map((para, i) => (
            <p key={i}>
              <RichText x={para} />
            </p>
          ))}
        </figure>
      );
    case "check":
      return (
        <div className="check">
          <div className="check-head">
            <Pict name="check" />
            <span className="check-skill">{b.skill}</span>
            <span className="check-dc">dc {b.dc}</span>
            <span className="check-action">{b.action}</span>
          </div>
          <dl className="check-tiers">
            {b.tiers.map((tr, i) => (
              <div key={i} className={`tier ${tr.k}`}>
                <dt>
                  <TierMark k={tr.k} />
                  {TIER_LABEL[tr.k]}
                </dt>
                <dd>
                  <RichText x={tr.x} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "loc":
      return (
        <div className="loc">
          <span className="loc-code">{b.code}</span>
          <span className="loc-name">{b.name}</span>
          <Severity threat={b.threat} />
        </div>
      );
    case "enc":
      return (
        <div className="enc">
          <div className="enc-head">
            <span className="enc-area">{b.area} encounter</span>
            <span className="enc-die">{b.die}</span>
          </div>
          {b.note && (
            <p className="enc-note">
              <RichText x={b.note} />
            </p>
          )}
          <ul className="enc-options">
            {b.options.map((o, i) => (
              <li key={i}>
                <span className="enc-opt-name">{o.name}</span>
                <span className="enc-opt-cr">{o.cr}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "hazard":
      return (
        <div className="hazard">
          <div className="hazard-head">
            <span className="hazard-flag">
              <Pict name="hazard" /> hazard
            </span>
            <span className="hazard-name">{b.name}</span>
          </div>
          <p className="hazard-x">
            <RichText x={b.x} />
          </p>
          {b.dcs && (
            <ul className="hazard-dcs">
              {b.dcs.map((d, i) => (
                <li key={i}>
                  <RichText x={d} />
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    case "call":
      return (
        <aside className={`call call-${b.kind}`}>
          <div className="call-label">
            <Pict name={CALL_PICT[b.kind] || "note"} />
            {CALL_LABEL[b.kind] || "Note"}
          </div>
          <div className="call-body">
            <div className="call-title">{b.title}</div>
            <p>
              <RichText x={b.x} />
            </p>
          </div>
        </aside>
      );
    case "npcs":
      return (
        <div className="npcs">
          {b.items.map((n, i) => (
            <div className="npc" key={i}>
              <span className="npc-name">{n.name}</span>
              <span className="npc-tag">{n.tag}</span>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function MapsView({ maps, onGo }) {
  const { scenario } = useScenarioData();
  if (!maps || maps.length === 0) return null;
  return (
    <article className="article">
      <div className="article-head">
        <ScenSym name="overview" className="article-sym" />
        <div className="article-eyebrow">{scenario?.meta?.sub}</div>
        <h2 className="article-title">Maps</h2>
        <span className="scroll-cue" aria-hidden="true"><Pict name="down" /></span>
      </div>
      {maps.map((m) => (
        <section className="map-block" key={m.id}>
          <div className="map-block-head">
            <span className="loc-code">{m.code}</span>
            <span className="loc-name">{m.name}</span>
          </div>
          <div className="map-fig">
            <img className="map-img" src={m.src} alt={`${m.name} map`} />
            {m.refs.map((r) => (
              <button
                key={r.label}
                className="map-pin"
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
                title={`${r.label} · ${r.name}`}
                onClick={() => onGo(r.to)}
              >{r.label}</button>
            ))}
          </div>
          {m.caption && <p className="map-caption">{m.caption}</p>}
          {m.refs.length > 0 && (
            <ul className="map-legend">
              {m.refs.map((r) => (
                <li key={r.label}>
                  <button className="map-legend-row" onClick={() => onGo(r.to)}>
                    <span className="map-legend-code">{r.label}</span>
                    <span className="map-legend-name">{r.name}</span>
                    <span className="rail-arrow">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}

export function ScenarioView({ section, onGo }) {
  const { scenario, links } = useScenarioData();
  const tabs = scenario?.tabs || [];
  const symFor = scenario?.symFor || {};
  const meta = scenario?.meta || {};
  // A custom campaign has no authored notes (no tabs) — show a friendly empty state.
  if (tabs.length === 0) {
    return (
      <article className="article">
        <div className="importer">
          <ScenSym name="overview" className="import-sym" />
          <h2 className="import-title">{meta.title || "custom campaign"}</h2>
          <p className="import-lead">no scenario notes are available for a custom campaign.</p>
        </div>
      </article>
    );
  }
  if (section === "maps") return <MapsView maps={scenario?.maps || []} onGo={onGo} />;
  const group = tabs.find((g) => g.items.some((i) => i.id === section));
  const item = group && group.items.find((i) => i.id === section);
  const content = (scenario?.content || {})[section] || [];
  return (
    <article className="article">
      <div className="article-head">
        <ScenSym name={symFor[section]} className="article-sym" />
        <div className="article-eyebrow">{group ? group.group : meta.sub}</div>
        <h2 className="article-title">{item ? item.label : section}</h2>
        <span className="scroll-cue" aria-hidden="true"><Pict name="down" /></span>
      </div>
      <LinkScope.Provider value={links}>
        {content.map((b, i) => <ScenarioBlock key={i} b={b} />)}
      </LinkScope.Provider>
    </article>
  );
}
