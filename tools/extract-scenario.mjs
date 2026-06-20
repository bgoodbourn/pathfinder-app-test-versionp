/*
 * Drift-proof scenario extraction.
 *
 * Slices the fenced BINDER:DATA blocks verbatim out of src/App.jsx, evaluates
 * them in a module scope, and serializes the assembled scenario object to
 * public/scenarios/<scenario_id>.json. Because the block text is copied byte-
 * for-byte (never re-typed or re-derived from the PDF), the JSON content is
 * guaranteed identical to what the binder renders today.
 *
 * Run: node tools/extract-scenario.mjs
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src", "App.jsx");
const SCENARIO_ID = "burden-of-envy";
const SCHEMA_VERSION = 1;

const source = fs.readFileSync(SRC, "utf8");

// Pull the body between a block's START and END fence markers, verbatim.
function block(name) {
  const re = new RegExp(
    `BINDER:DATA ${name} \\u2014 START[^\\n]*\\n([\\s\\S]*?)\\n/\\* === BINDER:DATA ${name} \\u2014 END`
  );
  const m = source.match(re);
  if (!m) throw new Error(`fence not found for ${name}`);
  return m[1];
}

// Order matters: image data-URIs are referenced by MAPS and ENCOUNTERS.
const blocks = [
  "SCENARIO_MAP_IMAGES",
  "SCENARIO_MAPS",
  "SCENARIO_NPCS",
  "SCENARIO_META",
  "SCENARIO_TABS",
  "SCENARIO_CONTENT",
  "SYM_FOR",
  "LINKS",
  "SCENARIO_ENCOUNTERS",
].map(block).join("\n\n");

const moduleSrc = `${blocks}

export const scenario = {
  scenario_id: ${JSON.stringify(SCENARIO_ID)},
  schema_version: ${SCHEMA_VERSION},
  title: SCENARIO_META.title,
  meta: SCENARIO_META,
  tabs: SCENARIO_TABS,
  symFor: SYM_FOR,
  content: SCENARIO_CONTENT,
  npcs: SCENARIO_NPCS,
  maps: SCENARIO_MAPS,
  encounters: SCENARIO_ENCOUNTERS,
  links: LINKS,
};
`;

const tmp = path.join(os.tmpdir(), `binder-extract-${process.pid}.mjs`);
fs.writeFileSync(tmp, moduleSrc);

const { scenario } = await import(pathToFileURL(tmp).href);
fs.rmSync(tmp);

// Content revision: a cheap, stable hash of the serialized content so the app
// can detect when git's base content changed and re-seed only then.
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
scenario.rev = djb2(JSON.stringify(scenario));

const out = path.join(ROOT, "public", "scenarios", `${SCENARIO_ID}.json`);
fs.writeFileSync(out, JSON.stringify(scenario, null, 2) + "\n");

// Maintain a manifest the app fetches to discover bundled scenarios at runtime.
const indexPath = path.join(ROOT, "public", "scenarios", "index.json");
let index = [];
if (fs.existsSync(indexPath)) {
  try {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  } catch {
    index = [];
  }
}
const entry = { scenario_id: scenario.scenario_id, title: scenario.title, rev: scenario.rev };
index = index.filter((e) => e.scenario_id !== entry.scenario_id).concat(entry);
index.sort((a, b) => a.title.localeCompare(b.title));
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

const bytes = fs.statSync(out).size;
console.log(`wrote ${path.relative(ROOT, out)} (${(bytes / 1024).toFixed(0)} KB)`);
console.log(
  `sections: ${Object.keys(scenario.content).length}, npcs: ${scenario.npcs.length}, ` +
    `maps: ${scenario.maps.length}, encounters: ${scenario.encounters.length}, ` +
    `links: ${Object.keys(scenario.links).length}, tabs groups: ${scenario.tabs.length}`
);
