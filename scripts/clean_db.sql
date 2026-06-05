-- Nettoyage base : supprime tous les anciens profils/sessions (KEVD0R, SV2026, etc.)
-- et ne garde qu'une structure propre : une ligne par trek + __settings__

-- 1. Supprimer toutes les lignes sauf les treks connus et __settings__
delete from rando_sync
where code not in ('gr10','ayous','artouste','bidarray-sare','sainte-victoire','__settings__');

-- 2. Créer les colonnes manquantes si besoin
alter table rando_sync add column if not exists active_trek text default null;
alter table rando_sync add column if not exists trek_note text default '';
alter table rando_sync add column if not exists trek_date text default '';
alter table rando_sync add column if not exists checklist_checked jsonb default '{}';
alter table rando_sync add column if not exists checklist_custom  jsonb default '[]';
alter table rando_sync add column if not exists gpx_track jsonb default null;

-- 3. Supprimer les colonnes obsolètes liées à l'ancien système multi-profil
alter table rando_sync drop column if exists itineraire;
alter table rando_sync drop column if exists trek_notes;
alter table rando_sync drop column if exists trek_dates;

-- 4. Insérer les lignes manquantes (idempotent)
insert into rando_sync (code, gpx_track, trek_note, trek_date, checklist_checked, checklist_custom, updated_at)
values
  ('gr10',            null, '', '', '{}', '[]', now()),
  ('ayous',           null, '', '', '{}', '[]', now()),
  ('artouste',        null, '', '', '{}', '[]', now()),
  ('bidarray-sare',   null, '', '', '{}', '[]', now()),
  ('sainte-victoire', null, '', '', '{}', '[]', now()),
  ('__settings__',    null, '', '', '{}', '[]', now())
on conflict (code) do nothing;

-- 5. Vérification finale
select code, active_trek, trek_note, trek_date,
       (gpx_track->>'name') as gpx_name,
       jsonb_array_length(checklist_custom) as custom_count,
       updated_at
from rando_sync
order by code;
