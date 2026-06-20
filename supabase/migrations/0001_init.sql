-- Campaign Binder — initial schema (already applied to the live project;
-- committed here for hygiene / reproducibility).

-- base scenario content (imported from the skill's JSON; canonical copy lives in git)
create table public.scenario (
  scenario_id    text primary key,        -- stable slug, e.g. 'burden-of-envy'
  title          text not null,
  content        jsonb not null,          -- verbatim objects: meta, tabs, notes, npcs, encounters, maps, links
  schema_version integer not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- user edits, layered over base content at render time
create table public.scenario_overlay (
  scenario_id    text primary key references public.scenario(scenario_id) on delete cascade,
  overlay        jsonb not null default '{}'::jsonb,   -- notes, customNpcs, encounters, pcs
  schema_version integer not null default 1,
  updated_at     timestamptz not null default now()
);

-- heartbeat — a scheduled GitHub Action pings this so the free project never idle-pauses
create table public.heartbeat (
  id        integer primary key default 1,
  pinged_at timestamptz not null default now()
);
insert into public.heartbeat (id) values (1) on conflict do nothing;

-- keep updated_at server-side (reliable last-write-wins on sync)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger scenario_touch         before update on public.scenario
  for each row execute function public.touch_updated_at();
create trigger scenario_overlay_touch before update on public.scenario_overlay
  for each row execute function public.touch_updated_at();

-- RLS: intentionally open (no auth, solo use). Explicit policies beat RLS-off.
alter table public.scenario         enable row level security;
alter table public.scenario_overlay enable row level security;
alter table public.heartbeat        enable row level security;

create policy anon_all_scenario  on public.scenario         for all to anon using (true) with check (true);
create policy anon_all_overlay   on public.scenario_overlay for all to anon using (true) with check (true);
create policy anon_all_heartbeat on public.heartbeat        for all to anon using (true) with check (true);
