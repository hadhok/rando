-- Migration: per-trek rows
-- Moves from one global row (code='KEVD0R') to one row per trek_id.

-- Add new columns if not exists
alter table rando_sync add column if not exists trek_note text default '';
alter table rando_sync add column if not exists trek_date text default '';
alter table rando_sync add column if not exists checklist_checked jsonb default '{}';
alter table rando_sync add column if not exists checklist_custom jsonb default '[]';

-- Create per-trek rows from KEVD0R data
-- (checklist data was stored as { trekId: data }, unpack it)
insert into rando_sync (code, gpx_track, trek_note, trek_date, checklist_checked, checklist_custom, updated_at)
values
  ('gr10',            null, '', '', '{}', '[]', now()),
  ('ayous',           null, '', '', '{}', '[]', now()),
  ('artouste',        null, '', '', '{}', '[]', now()),
  ('bidarray-sare',   null, '', '', '{}', '[]', now()),
  ('sainte-victoire', null, '', '', '{}', '[]', now()),
  ('__settings__',    null, '', '', '{}', '[]', now())
on conflict (code) do nothing;

-- Copy Ayous GPX from KEVD0R to ayous row
update rando_sync set gpx_track = (select gpx_track from rando_sync where code = 'KEVD0R')
where code = 'ayous' and (gpx_track is null);

-- Copy active_trek to settings
update rando_sync set active_trek = (select active_trek from rando_sync where code = 'KEVD0R')
where code = '__settings__';

-- Copy trek_dates from KEVD0R map to individual rows
update rando_sync r set trek_date = (
  select (k.trek_dates->>r.code)
  from rando_sync k where k.code = 'KEVD0R'
)
where r.code in ('gr10','ayous','artouste','bidarray-sare','sainte-victoire')
and exists (select 1 from rando_sync where code = 'KEVD0R' and trek_dates ? r.code);

-- Copy checklist data from nested format to flat per-trek
update rando_sync r set
  checklist_checked = coalesce((select k.checklist_checked->r.code from rando_sync k where k.code = 'KEVD0R'), '{}'),
  checklist_custom  = coalesce((select k.checklist_custom->r.code  from rando_sync k where k.code = 'KEVD0R'), '[]')
where r.code in ('gr10','ayous','artouste','bidarray-sare','sainte-victoire');
