#!/usr/bin/env node
/**
 * Réimporte le GPX + initialise checklist_checked / checklist_custom dans Supabase.
 * Usage: node scripts/pushToSupabase.js [code]
 * Par défaut code = KEVD0R
 */

const SB_URL = 'https://zodywxrnyaiviuahxuvw.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZHl3eHJueWFpdml1YWh4dXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDUzMzMsImV4cCI6MjA5NTQ4MTMzM30.ZiqmEIg1Xfq70qTwiIw3N58LAoP540J3Bo8inCqUCuk';
const TABLE = `${SB_URL}/rest/v1/rando_sync`;
const HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json',
};

const code = process.argv[2] || 'KEVD0R';

async function main() {
  // 1. Lire la ligne existante
  console.log(`🔍 Lecture de la ligne code=${code}…`);
  const getRes = await fetch(`${TABLE}?code=eq.${code}&select=*`, { headers: HEADERS });
  if (!getRes.ok) {
    console.error('❌ Erreur GET:', getRes.status, await getRes.text());
    process.exit(1);
  }
  const rows = await getRes.json();
  if (!rows.length) {
    console.error(`❌ Aucune ligne trouvée pour code=${code}`);
    process.exit(1);
  }
  const row = rows[0];
  console.log(`✅ Ligne trouvée — trek actif: ${row.active_trek || '(aucun)'}`);
  console.log(`   GPX: ${row.gpx_track?.name || '(aucun)'}`);
  console.log(`   checklist_checked: ${JSON.stringify(row.checklist_checked)}`);
  console.log(`   checklist_custom:  ${JSON.stringify(row.checklist_custom)}`);

  // 2. Préparer le patch — on préserve tout et on initialise les colonnes vides
  const patch = {
    code,
    gpx_track:          row.gpx_track,
    itineraire:         row.itineraire,
    trek_notes:         row.trek_notes   ?? {},
    active_trek:        row.active_trek  ?? null,
    trek_dates:         row.trek_dates   ?? {},
    checklist_checked:  row.checklist_checked ?? {},
    checklist_custom:   row.checklist_custom  ?? [],
    updated_at:         new Date().toISOString(),
  };

  console.log('\n📤 Envoi du patch vers Supabase…');
  const patchRes = await fetch(`${TABLE}?on_conflict=code`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(patch),
  });

  if (patchRes.ok) {
    console.log('✅ Sync réussi !');
    console.log(`   GPX: ${patch.gpx_track?.name ?? '(aucun)'} — ${patch.gpx_track?.points?.length ?? 0} points`);
    console.log(`   active_trek: ${patch.active_trek}`);
    console.log(`   trek_dates:  ${JSON.stringify(patch.trek_dates)}`);
    console.log(`   checklist_checked: ${Object.keys(patch.checklist_checked).length} items cochés`);
    console.log(`   checklist_custom:  ${patch.checklist_custom.length} items perso`);
  } else {
    const err = await patchRes.text();
    console.error('❌ Erreur PATCH:', patchRes.status, err);

    // Si la colonne n'existe pas encore, afficher l'instruction
    if (err.includes('checklist')) {
      console.error('\n⚠️  Les colonnes checklist ne semblent pas exister.');
      console.error('   Exécute dans Supabase SQL Editor :');
      console.error('   alter table rando_sync add column if not exists checklist_checked jsonb;');
      console.error('   alter table rando_sync add column if not exists checklist_custom jsonb;');
    }
    process.exit(1);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
