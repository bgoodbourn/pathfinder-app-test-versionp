/*
 * Removes the fenced BINDER:DATA blocks from src/App.jsx (their content now
 * lives in /scenarios/*.json and is loaded at runtime via the data layer).
 * Idempotent: running twice is a no-op. Run: node tools/strip-data-blocks.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src", "App.jsx");

const NAMES = [
  "SCENARIO_MAP_IMAGES",
  "SCENARIO_MAPS",
  "SCENARIO_NPCS",
  "SCENARIO_META",
  "SCENARIO_TABS",
  "SCENARIO_CONTENT",
  "SYM_FOR",
  "LINKS",
  "SCENARIO_ENCOUNTERS",
];

let src = fs.readFileSync(SRC, "utf8");
let removed = 0;
for (const name of NAMES) {
  const re = new RegExp(
    `/\\* === BINDER:DATA ${name} \\u2014 START[\\s\\S]*?BINDER:DATA ${name} \\u2014 END === \\*/\\n?`
  );
  if (re.test(src)) {
    src = src.replace(re, `/* ${name}: loaded at runtime from the scenario data layer */\n`);
    removed++;
  }
}
fs.writeFileSync(SRC, src);
console.log(`stripped ${removed}/${NAMES.length} data blocks`);
