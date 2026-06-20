/* ------------------------------------------------------------------ *
 *  Supabase — background backup/sync, NOT load-bearing.
 *
 *  The publishable (anon) key ships in the client by design. If env vars
 *  are absent (e.g. local dev with sync off) the client is null and every
 *  function here degrades to a no-op — the app runs fully on IndexedDB.
 *
 *  Maps between the app's blob shapes and the Postgres row shapes:
 *    scenario row:  { scenario_id, title, content jsonb, schema_version, updated_at }
 *    overlay  row:  { scenario_id, overlay jsonb, schema_version, updated_at }
 *  (content jsonb = the base blob minus scenario_id/title/schema_version)
 * ------------------------------------------------------------------ */
import { createClient } from "@supabase/supabase-js";
import { SCHEMA_VERSION } from "./schema.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;
export const remoteEnabled = !!supabase;

const CONTENT_KEYS = ["meta", "tabs", "symFor", "content", "npcs", "maps", "encounters", "links"];

function toScenarioRow(blob) {
  const content = {};
  for (const k of CONTENT_KEYS) content[k] = blob[k];
  return {
    scenario_id: blob.scenario_id,
    title: blob.title,
    content,
    schema_version: blob.schema_version ?? SCHEMA_VERSION,
  };
}

function fromScenarioRow(row) {
  if (!row) return null;
  const content = row.content || {};
  return {
    scenario_id: row.scenario_id,
    schema_version: row.schema_version ?? SCHEMA_VERSION,
    title: row.title,
    ...CONTENT_KEYS.reduce((o, k) => ((o[k] = content[k]), o), {}),
    updated_at: row.updated_at,
  };
}

function fromOverlayRow(row) {
  if (!row) return null;
  return {
    scenario_id: row.scenario_id,
    schema_version: row.schema_version ?? SCHEMA_VERSION,
    overlay: row.overlay || {},
    updated_at: row.updated_at,
  };
}

export async function remoteListScenarios() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("scenario").select("scenario_id, title, updated_at");
  if (error) throw error;
  return data || [];
}

export async function remoteGetScenario(id) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("scenario").select("*").eq("scenario_id", id).maybeSingle();
  if (error) throw error;
  return fromScenarioRow(data);
}

export async function remoteUpsertScenario(blob) {
  if (!supabase) return null;
  const { error } = await supabase.from("scenario").upsert(toScenarioRow(blob), { onConflict: "scenario_id" });
  if (error) throw error;
  return true;
}

export async function remoteGetOverlay(id) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("scenario_overlay").select("*").eq("scenario_id", id).maybeSingle();
  if (error) throw error;
  return fromOverlayRow(data);
}

export async function remoteUpsertOverlay(blob) {
  if (!supabase) return null;
  const { error } = await supabase.from("scenario_overlay").upsert(
    {
      scenario_id: blob.scenario_id,
      overlay: blob.overlay,
      schema_version: blob.schema_version ?? SCHEMA_VERSION,
    },
    { onConflict: "scenario_id" }
  );
  if (error) throw error;
  return true;
}

export async function remoteHeartbeat() {
  if (!supabase) return null;
  const { error } = await supabase.from("heartbeat").upsert({ id: 1 }, { onConflict: "id" });
  if (error) throw error;
  return true;
}
