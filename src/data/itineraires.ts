import { Itineraire } from '../utils/itineraireParser';

export const ITINERAIRE_GR10: Itineraire = {
  title: 'GR10 — Biriatou → Ainhoa — 3 jours',
  subtitle: '34 km · D+ 2 300 m · Moyen',
  warnings: [
    'Pas de ravitaillement entre Biriatou et Sare (J1+J2) — prévoir nourriture 2 jours',
    'Bivouac obligatoire — aucun refuge gardé sur ce tronçon',
    'Retour Ainhoa → Biriatou : TAD Txik-Txak, réserver 1h avant (05 47 75 76 64)',
  ],
  days: [
    {
      label: 'Jour 1 — Biriatou → Olheta (13,6 km · D+ 849 m · ~7h50)',
      waypoints: [
        { name: 'Biriatou', badges: ['dep', 'eau'], rowClass: 'jstart', distCum: '0 km', alt: '56 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '09h00' },
        { name: "Col d'Ibardin", badges: ['eau'], rowClass: '', distCum: '7,5 km', alt: '318 m', dp: '+643 m', dm: '-381 m', segTime: '+4h47', cumTime: '4h47', heure: '13h47' },
        { name: 'Olheta', badges: ['fin', 'biv', 'eau'], rowClass: 'biv', distCum: '13,6 km', alt: '96 m', dp: '+849 m', dm: '-809 m', segTime: '+3h03', cumTime: '7h50', heure: '16h50' },
      ],
    },
    {
      label: 'Jour 2 — Olheta → Frontière (14,7 km · D+ 647 m · ~7h06)',
      waypoints: [
        { name: 'Olheta', badges: ['dep', 'eau'], rowClass: 'jstart', distCum: '0 km', alt: '96 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '09h00' },
        { name: 'Col des 3 Fontaines', badges: ['star', 'biv'], rowClass: 'star', distCum: '3,4 km', alt: '563 m', dp: '+467 m', dm: '—', segTime: '+2h24', cumTime: '2h24', heure: '11h24' },
        { name: 'Sare', badges: ['star', 'eau', 'ref'], rowClass: 'star', distCum: '9,2 km', alt: '80 m', dp: '+512 m', dm: '-995 m', segTime: '+2h39', cumTime: '5h03', heure: '14h03' },
        { name: 'Frontière', badges: ['fin', 'biv'], rowClass: 'biv', distCum: '14,7 km', alt: '110 m', dp: '+647 m', dm: '-633 m', segTime: '+2h03', cumTime: '7h06', heure: '16h06' },
      ],
    },
    {
      label: 'Jour 3 — Frontière → Ainhoa (10,4 km · D+ 519 m · ~4h35)',
      waypoints: [
        { name: 'Frontière', badges: ['dep'], rowClass: 'jstart', distCum: '0 km', alt: '110 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '09h00' },
        { name: 'Pont du Diable', badges: ['eau'], rowClass: '', distCum: '2,9 km', alt: '58 m', dp: '+16 m', dm: '-68 m', segTime: '+0h55', cumTime: '0h55', heure: '09h55' },
        { name: 'Ainhoa', badges: ['star', 'eau', 'ref'], rowClass: 'star', distCum: '5,8 km', alt: '125 m', dp: '+105 m', dm: '-38 m', segTime: '+1h04', cumTime: '1h59', heure: '10h59' },
        { name: 'Col des 3 Croix', badges: ['fin', 'biv'], rowClass: 'biv', distCum: '10,4 km', alt: '503 m', dp: '+519 m', dm: '-141 m', segTime: '+2h36', cumTime: '4h35', heure: '13h35' },
      ],
    },
  ],
  notes:
    'Parking Biriatou : gratuit, non gardé, village. ' +
    'Retour depuis Ainhoa : TAD Txik-Txak 05 47 75 76 64 (Lun–Sam 7h30–19h, réserver 1h avant). ' +
    'Ravitaillement possible à Sare (J2) uniquement. ' +
    'Balises GR10 blanches et rouges tout le long.',
};

export const ITINERAIRE_AYOUS: Itineraire = {
  title: "Lacs d'Ayous — Boucle Ossau — 2 jours",
  subtitle: '16 km · D+ 940 m · Moyen',
  warnings: [
    'Bivouac interdit au lac Gentau du 1er juillet au 30 septembre — aller au lac Bersau (+30 min)',
    'Parking Bious-Oumettes complet dès 9h en saison — arriver avant 8h',
    'Zone Parc National : bivouac autorisé 19h–9h uniquement, pas de feux ni de chiens',
  ],
  days: [
    {
      label: "Jour 1 — Bious-Oumettes → Lac Bersau (9,5 km · D+ 850 m · ~5h23)",
      waypoints: [
        { name: 'Bious-Oumettes', badges: ['dep', 'biv'], rowClass: 'jstart', distCum: '0 km', alt: '1302 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '09h00' },
        { name: 'Lac Bious-Artigues', badges: ['star', 'eau'], rowClass: 'star', distCum: '2 km', alt: '1416 m', dp: '+120 m', dm: '-6 m', segTime: '+0h55', cumTime: '0h55', heure: '09h55' },
        { name: 'Lac Roumassot', badges: ['eau'], rowClass: '', distCum: '6,5 km', alt: '1845 m', dp: '+580 m', dm: '-57 m', segTime: '+2h43', cumTime: '3h38', heure: '12h38' },
        { name: 'Lac Gentau + Refuge', badges: ['star', 'ref'], rowClass: 'star', distCum: '7,8 km', alt: '1965 m', dp: '+710 m', dm: '-57 m', segTime: '+0h47', cumTime: '4h25', heure: '13h25' },
        { name: 'Lac Bersau', badges: ['fin', 'biv', 'eau'], rowClass: 'biv', distCum: '9,5 km', alt: '2083 m', dp: '+850 m', dm: '-69 m', segTime: '+0h58', cumTime: '5h23', heure: '14h23' },
      ],
    },
    {
      label: "Jour 2 — Lac Bersau → Bious-Oumettes (6,5 km · D- 860 m · ~3h36)",
      waypoints: [
        { name: 'Lac Bersau', badges: ['dep', 'eau'], rowClass: 'jstart', distCum: '0 km', alt: '2083 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '09h00' },
        { name: 'Lac Casteirao', badges: ['star', 'eau'], rowClass: 'star', distCum: '1 km', alt: '1943 m', dp: '+0 m', dm: '-150 m', segTime: '+0h34', cumTime: '0h34', heure: '09h34' },
        { name: "Col Long d'Ayous", badges: [], rowClass: '', distCum: '2 km', alt: '1980 m', dp: '+50 m', dm: '-113 m', segTime: '+0h29', cumTime: '1h03', heure: '10h03' },
        { name: 'Pont de Bious', badges: ['eau'], rowClass: '', distCum: '3,5 km', alt: '1542 m', dp: '+50 m', dm: '-600 m', segTime: '+1h13', cumTime: '2h16', heure: '11h16' },
        { name: 'Bious-Oumettes', badges: ['fin'], rowClass: '', distCum: '6,5 km', alt: '1302 m', dp: '+50 m', dm: '-860 m', segTime: '+1h20', cumTime: '3h36', heure: '12h36' },
      ],
    },
  ],
  notes:
    'Parking Bious-Oumettes : 5€/jour. ' +
    'Refuge Pombie (Lac Gentau) : 06 09 08 37 98 — demi-pension ~45€. ' +
    'Carte IGN 1547OT Ossau / Vallée d\'Aspe indispensable. ' +
    'Eau des lacs : filtrer systématiquement.',
};

export const ITINERAIRE_ARTOUSTE: Itineraire = {
  title: "Lac d'Artouste + Refuge Arrémoulit — 2 jours",
  subtitle: '20 km · D+ 1 100 m · Moyen–Difficile',
  warnings: [
    "Passage d'Orteig (J2) : très glissant par temps humide — bâtons indispensables",
    'Petit train Artouste : dernier départ 15h — ne pas rater',
    'Refuge Arrémoulit : 28 places, réserver impérativement (refugedarremoulit.ffcam.fr)',
  ],
  days: [
    {
      label: "Jour 1 — Caillou de Soques → Lac d'Artouste (11 km · D+ 680 m · ~6h24)",
      waypoints: [
        { name: 'Caillou de Soques', badges: ['dep'], rowClass: 'jstart', distCum: '0 km', alt: '1400 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '09h00' },
        { name: 'Plaine Soussouéou', badges: ['eau'], rowClass: '', distCum: '3,5 km', alt: '1420 m', dp: '+30 m', dm: '-10 m', segTime: '+0h59', cumTime: '0h59', heure: '09h59' },
        { name: 'Col du Lurien', badges: ['star'], rowClass: 'star', distCum: '7,5 km', alt: '2005 m', dp: '+640 m', dm: '-75 m', segTime: '+3h08', cumTime: '4h07', heure: '13h07' },
        { name: "Lac d'Artouste", badges: ['fin', 'biv', 'eau'], rowClass: 'biv', distCum: '11 km', alt: '1997 m', dp: '+680 m', dm: '-83 m', segTime: '+2h17', cumTime: '6h24', heure: '15h24' },
      ],
    },
    {
      label: 'Jour 2 — Train + Arrémoulit → Retour (~11,9 km · D+ 400 m · ~7h00)',
      waypoints: [
        { name: '🚂 Train lac → Sagette', badges: ['dep'], rowClass: 'jstart', distCum: '—', alt: '1934 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '~10h00' },
        { name: 'Refuge Arrémoulit', badges: ['star', 'ref'], rowClass: 'star', distCum: '3,4 km', alt: '2260 m', dp: '+400 m', dm: '-74 m', segTime: '+2h20', cumTime: '2h20', heure: '12h20' },
        { name: "Lac d'Arrious", badges: ['eau'], rowClass: '', distCum: '6,9 km', alt: '1994 m', dp: '+430 m', dm: '-700 m', segTime: '+2h05', cumTime: '4h25', heure: '14h25' },
        { name: 'Caillou de Soques', badges: ['fin'], rowClass: '', distCum: '11,9 km', alt: '1400 m', dp: '+430 m', dm: '-1320 m', segTime: '+2h35', cumTime: '7h00', heure: '17h00' },
      ],
    },
  ],
  notes:
    'Petit train Artouste : artouste.fr — billet campeur ~20€ — 1er départ ~9h. ' +
    'Refuge Arrémoulit : refugedarremoulit.ffcam.fr — 28 places — réserver. ' +
    "Passage d'Orteig entre Arrémoulit et lac d'Arrious : délicat par temps humide. " +
    'Carte IGN 1547OT Ossau / Vallée d\'Aspe.',
};

export const ITINERAIRE_BIDARRAY_SJPP: Itineraire = {
  title: 'Bidarray → Saint-Jean-Pied-de-Port — 2 jours · GR10',
  subtitle: '42 km · D+ 1 700 m · Moyen',
  warnings: [
    "Crêtes d'Aldudes exposées au vent — prévoir coupe-vent même en été",
    "Peu de points d'eau entre Bidarray et Saint-Étienne : prévoir 1,5 L",
    "Saint-Jean-Pied-de-Port très fréquenté (pèlerins de Compostelle) — réserver l'hébergement à l'avance",
  ],
  days: [
    {
      label: "Jour 1 — Bidarray → Saint-Étienne-de-Baïgorry (22 km · D+ 950 m · ~6h30)",
      waypoints: [
        { name: 'Bidarray', badges: ['dep', 'eau'], rowClass: 'jstart', distCum: '0 km', alt: '95 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '08h00' },
        { name: 'Col de Méhatché', badges: [], rowClass: '', distCum: '5 km', alt: '708 m', dp: '+613 m', dm: '—', segTime: '+2h00', cumTime: '2h00', heure: '10h00' },
        { name: "Crêtes d'Aldudes (Pic Ur, 1118 m)", badges: ['star'], rowClass: 'star', distCum: '10 km', alt: '1118 m', dp: '+490 m', dm: '-80 m', segTime: '+2h00', cumTime: '4h00', heure: '12h00' },
        { name: 'Col Adi (1115 m)', badges: ['eau'], rowClass: '', distCum: '14 km', alt: '1115 m', dp: '+80 m', dm: '-83 m', segTime: '+1h00', cumTime: '5h00', heure: '13h00' },
        { name: 'Saint-Étienne-de-Baïgorry', badges: ['fin', 'eau', 'ref'], rowClass: '', distCum: '22 km', alt: '163 m', dp: '+0 m', dm: '-952 m', segTime: '+1h30', cumTime: '6h30', heure: '14h30' },
      ],
    },
    {
      label: "Jour 2 — Saint-Étienne-de-Baïgorry → Saint-Jean-Pied-de-Port (20 km · D+ 750 m · ~5h30)",
      waypoints: [
        { name: 'Saint-Étienne-de-Baïgorry', badges: ['dep', 'eau'], rowClass: 'jstart', distCum: '0 km', alt: '163 m', dp: '—', dm: '—', segTime: '—', cumTime: '0h00', heure: '08h30' },
        { name: 'Col Burdincurutcheta (1135 m)', badges: ['star'], rowClass: 'star', distCum: '7 km', alt: '1135 m', dp: '+972 m', dm: '—', segTime: '+2h30', cumTime: '2h30', heure: '11h00' },
        { name: 'Col Arnostéguy (1278 m)', badges: [], rowClass: '', distCum: '11 km', alt: '1278 m', dp: '+220 m', dm: '-77 m', segTime: '+1h15', cumTime: '3h45', heure: '12h15' },
        { name: 'Ferme Ithurramburu', badges: ['eau'], rowClass: '', distCum: '15 km', alt: '600 m', dp: '—', dm: '-678 m', segTime: '+1h00', cumTime: '4h45', heure: '13h15' },
        { name: 'Saint-Jean-Pied-de-Port', badges: ['fin', 'eau', 'ref'], rowClass: '', distCum: '20 km', alt: '183 m', dp: '—', dm: '-417 m', segTime: '+0h45', cumTime: '5h30', heure: '14h00' },
      ],
    },
  ],
  notes:
    'Aller : TER Bayonne → Bidarray-Ossès (~50 min, 4–5 trains/j). ' +
    'Retour : TER Saint-Jean-Pied-de-Port → Bayonne (~1h15, 4–5 trains/j, ~8€). ' +
    'Horaires exacts sur ter.sncf.com (ligne 64 Bayonne–Saint-Jean-Pied-de-Port). ' +
    "Hébergement J1 Saint-Étienne : gîte communal Etxola, hôtels, chambres d'hôtes. " +
    'Hébergement J2 SJPP : nombreux gîtes pèlerins (Compostelle), réserver en saison. ' +
    'Balises GR10 blanches et rouges tout le long.',
};

export const ITINERAIRES: Partial<Record<string, Itineraire>> = {
  gr10: ITINERAIRE_GR10,
  ayous: ITINERAIRE_AYOUS,
  artouste: ITINERAIRE_ARTOUSTE,
  'bidarray-sare': ITINERAIRE_BIDARRAY_SJPP,
};
