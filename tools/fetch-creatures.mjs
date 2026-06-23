#!/usr/bin/env node
/*
 * Regenerate src/data/creatures.json from the Archives of Nethys search index.
 *
 * Pulls every creature stat block from the public AoN Elasticsearch index, keeps
 * only the rulebooks we care about, collapses legacy/remaster duplicates
 * (preferring the remaster printing), and writes a compact record per creature.
 *
 * Run:  node tools/fetch-creatures.mjs
 *
 * The AoN id + url are stored verbatim so the "open in Archives of Nethys" link
 * is correct for both legacy Monsters.aspx pages and remaster NPCs.aspx pages.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ES = "https://elasticsearch.aonprd.com/aon/_search";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "creatures.json");

// Exact AoN `source` names we want, with whether each is a remaster printing.
// Remaster printings win when a creature appears in both a legacy and a remaster book.
const BOOKS = {
  "Bestiary": { remaster: false },
  "Bestiary 2": { remaster: false },
  "Bestiary 3": { remaster: false },
  "Core Rulebook": { remaster: false },
  "Monster Core": { remaster: true },
  "Monster Core 2": { remaster: true },
  "NPC Core": { remaster: true },
  "Player Core": { remaster: true },
  "Book of the Dead": { remaster: true },
};
const WANTED = new Set(Object.keys(BOOKS));

// numeric AoN id out of "creature-3024"
const numId = (id) => Number(String(id).replace(/[^0-9]/g, ""));

async function fetchPage(from, size) {
  const body = {
    from,
    size,
    _source: [
      "id", "name", "level", "ac", "hp", "fortitude_save", "reflex_save",
      "will_save", "perception", "creature_family", "trait", "source", "legacy_id", "url",
    ],
    query: { bool: { filter: [{ term: { category: "creature" } }] } },
  };
  const res = await fetch(ES, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AoN responded ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAllCreatures() {
  const out = [];
  const size = 1000;
  const first = await fetchPage(0, size);
  const total = first.hits.total.value;
  out.push(...first.hits.hits.map((h) => h._source));
  process.stdout.write(`\rfetched ${out.length}/${total}…`);
  for (let from = size; from < total; from += size) {
    const page = await fetchPage(from, Math.min(size, total - from));
    out.push(...page.hits.hits.map((h) => h._source));
    process.stdout.write(`\rfetched ${out.length}/${total}…`);
  }
  process.stdout.write("\n");
  return out;
}

function pickSource(sources) {
  // A creature may be reprinted in several books; choose the first one we want,
  // preferring a remaster printing so the record's `source` reflects what won.
  const wanted = (sources || []).filter((s) => WANTED.has(s));
  if (wanted.length === 0) return null;
  wanted.sort((a, b) => Number(BOOKS[b].remaster) - Number(BOOKS[a].remaster));
  return wanted[0];
}

function toRecord(c, source) {
  return {
    id: numId(c.id),
    name: c.name,
    level: c.level,
    ac: c.ac,
    hp: c.hp,
    fort: c.fortitude_save,
    ref: c.reflex_save,
    will: c.will_save,
    per: c.perception,
    family: c.creature_family || null,
    traits: c.trait || [],
    source,
    url: c.url, // e.g. "/NPCs.aspx?ID=3024" or "/Monsters.aspx?ID=55"
  };
}

async function main() {
  const all = await fetchAllCreatures();

  // Keep only creatures printed in a wanted book, tagging each with its winning source.
  const kept = [];
  for (const c of all) {
    const source = pickSource(c.source);
    if (!source) continue;
    // Require the stats the selector + card depend on.
    if (c.ac == null || c.hp == null || c.level == null) continue;
    kept.push({ c, source, remaster: BOOKS[source].remaster });
  }

  // Dedup, preferring remaster. A remaster creature lists the legacy ids it
  // supersedes in `legacy_id`; drop any legacy entry we matched that way.
  const supersededIds = new Set();
  for (const { c, remaster } of kept) {
    if (remaster && Array.isArray(c.legacy_id)) {
      for (const lid of c.legacy_id) supersededIds.add(numId(lid));
    }
  }

  // Fallback dedup by name: if the same name survives in both a remaster and a
  // legacy book (no legacy_id link), keep the remaster one.
  const byName = new Map();
  for (const entry of kept) {
    if (supersededIds.has(numId(entry.c.id))) continue; // dropped: superseded legacy
    const key = entry.c.name.toLowerCase();
    const prev = byName.get(key);
    if (!prev) { byName.set(key, entry); continue; }
    // Prefer remaster; otherwise keep the earlier (stable) one.
    if (entry.remaster && !prev.remaster) byName.set(key, entry);
  }

  const records = [...byName.values()]
    .map(({ c, source }) => toRecord(c, source))
    .sort((a, b) => a.name.localeCompare(b.name));

  await writeFile(OUT, JSON.stringify(records) + "\n");

  // Report.
  const perBook = {};
  for (const r of records) perBook[r.source] = (perBook[r.source] || 0) + 1;
  console.log(`\nwrote ${records.length} creatures to ${OUT}`);
  for (const [book, n] of Object.entries(perBook).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${book}`);
  }
}

main().catch((err) => {
  console.error("\nfailed:", err.message);
  process.exit(1);
});
