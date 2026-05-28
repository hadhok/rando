export type BadgeType = 'water' | 'biv' | 'village' | 'refuge';
export type RowType = 'normal' | 'biv' | 'highlight';

export interface StageRow {
  name: string;
  dist: string;
  alt: string;
  dp: string;
  time: string;
  badges?: BadgeType[];
  rowType?: RowType;
}

export interface TrekDay {
  title: string;
  stages: StageRow[];
}

export interface TrekNote {
  icon: string;
  label: string;
  sub: string;
}

export interface Trek {
  id: string;
  name: string;
  days: number;
  distance: string;
  dp: string;
  region: string;
  maxAlt: string;
  difficulty: 1 | 2 | 3;
  color: string;
  cardElevPath: string;
  detailElevPath: string;
  trekDays: TrekDay[];
  notes: TrekNote[];
}

export const TREKS: Trek[] = [
  {
    id: 'gr10',
    name: 'GR10 — Biriatou → Ainhoa',
    days: 3,
    distance: '34km',
    dp: '+2.3k',
    region: 'Pays B.',
    maxAlt: '563m',
    difficulty: 2,
    color: '#2d6a3a',
    cardElevPath:
      'M0,55 L20,50 L40,42 L70,25 L90,28 L120,20 L140,22 L160,38 L180,15 L200,18 L220,12 L250,32 L270,28 L300,35 L320,20 L350,18 L380,30 L400,35 L400,60 L0,60 Z',
    detailElevPath:
      'M0,55 L25,50 L50,38 L80,20 L100,22 L130,14 L150,16 L175,32 L190,10 L210,12 L235,8 L265,30 L285,22 L310,28 L325,14 L360,12 L385,24 L400,28 L400,60 L0,60 Z',
    trekDays: [
      {
        title: 'Jour 1 · Biriatou → Olheta · Départ 09h00',
        stages: [
          { name: 'Biriatou', dist: '0km', alt: '56m', dp: '—', time: '09h00' },
          { name: 'Col des Poiriers', dist: '4km', alt: '313m', dp: '+433m', time: '11h48' },
          {
            name: "Col d'Ibardin",
            dist: '7.5km',
            alt: '318m',
            dp: '+643m',
            time: '13h47',
            badges: ['water'],
          },
          {
            name: 'Olheta',
            dist: '13.6km',
            alt: '96m',
            dp: '+849m',
            time: '16h50',
            badges: ['biv', 'water'],
            rowType: 'biv',
          },
        ],
      },
      {
        title: 'Jour 2 · Olheta → Frontière · Départ 09h00',
        stages: [
          { name: 'Col des 3 Fontaines', dist: '3.4km', alt: '563m', dp: '+467m', time: '11h24', badges: ['biv'] },
          {
            name: 'Sare',
            dist: '9.2km',
            alt: '80m',
            dp: '+512m',
            time: '14h03',
            badges: ['village', 'water'],
            rowType: 'highlight',
          },
          {
            name: 'Frontière',
            dist: '14.7km',
            alt: '110m',
            dp: '+647m',
            time: '16h06',
            badges: ['biv'],
            rowType: 'biv',
          },
        ],
      },
      {
        title: 'Jour 3 · Frontière → Ainhoa · Départ 09h00',
        stages: [
          { name: 'Pont du Diable', dist: '2.9km', alt: '58m', dp: '+16m', time: '09h55', badges: ['water'] },
          {
            name: 'Ainhoa',
            dist: '5.8km',
            alt: '125m',
            dp: '+105m',
            time: '10h59',
            badges: ['village'],
            rowType: 'highlight',
          },
          { name: 'Col des 3 Croix', dist: '10.4km', alt: '503m', dp: '+519m', time: '13h35', rowType: 'biv' },
          { name: '↩ Retour Ainhoa (TAD)', dist: '~4.6km', alt: '125m', dp: '-414m', time: '~14h45' },
        ],
      },
    ],
    notes: [
      { icon: '🅿️', label: 'Parking Biriatou', sub: 'Village · Gratuit · Non gardé · 3 jours OK' },
      { icon: '📞', label: 'Retour TAD', sub: '05 47 75 76 64 · Lun–Sam 7h30–19h · Réserver 1h avant' },
    ],
  },
  {
    id: 'ayous',
    name: "Lacs d'Ayous — Boucle Ossau",
    days: 2,
    distance: '16km',
    dp: '+940m',
    region: 'Ossau',
    maxAlt: '2083m',
    difficulty: 2,
    color: '#2a5a8a',
    cardElevPath:
      'M0,50 L30,45 L60,40 L100,28 L130,18 L160,10 L180,8 L200,10 L230,22 L260,14 L290,18 L310,12 L340,8 L370,20 L400,30 L400,60 L0,60 Z',
    detailElevPath:
      'M0,50 L30,45 L70,35 L110,22 L140,12 L165,8 L180,6 L200,8 L230,14 L260,8 L275,10 L295,15 L320,10 L345,18 L375,35 L400,45 L400,60 L0,60 Z',
    trekDays: [
      {
        title: 'Jour 1 · Bious-Oumettes → Lac Bersau · Départ 09h00',
        stages: [
          { name: 'Bious-Oumettes', dist: '0km', alt: '1302m', dp: '—', time: '09h00', badges: ['biv'] },
          {
            name: 'Lac Bious-Artigues',
            dist: '2km',
            alt: '1416m',
            dp: '+120m',
            time: '09h55',
            badges: ['water'],
            rowType: 'highlight',
          },
          { name: 'Lac Roumassot', dist: '6.5km', alt: '1845m', dp: '+580m', time: '12h38', badges: ['water'] },
          {
            name: 'Lac Gentau + Refuge',
            dist: '7.8km',
            alt: '1965m',
            dp: '+710m',
            time: '13h25',
            badges: ['refuge'],
            rowType: 'highlight',
          },
          {
            name: 'Lac Bersau',
            dist: '9.5km',
            alt: '2083m',
            dp: '+850m',
            time: '14h23',
            badges: ['biv', 'water'],
            rowType: 'biv',
          },
        ],
      },
      {
        title: 'Jour 2 · Lac Bersau → Bious-Oumettes · Départ 09h00',
        stages: [
          {
            name: 'Lac Casteirao',
            dist: '1km',
            alt: '1943m',
            dp: '-150m',
            time: '09h34',
            badges: ['water'],
            rowType: 'highlight',
          },
          { name: "Col Long d'Ayous", dist: '2km', alt: '1980m', dp: '+50m', time: '10h03' },
          { name: 'Pont de Bious', dist: '3.5km', alt: '1542m', dp: '-600m', time: '11h16', badges: ['water'] },
          { name: 'Bious-Oumettes', dist: '6.5km', alt: '1302m', dp: '-860m', time: '12h36', rowType: 'biv' },
        ],
      },
    ],
    notes: [
      {
        icon: '⚠️',
        label: 'Bivouac lac Gentau interdit',
        sub: '1er juillet → 30 septembre · Aller au lac Bersau (+30 min)',
      },
      { icon: '🅿️', label: 'Parking Bious-Oumettes', sub: "5€ · Arriver avant 8h en saison · Complet dès 9h" },
      { icon: '🗺', label: 'Carte IGN 1547OT', sub: "Ossau / Vallée d'Aspe" },
    ],
  },
  {
    id: 'artouste',
    name: "Lac d'Artouste + Arrémoulit",
    days: 2,
    distance: '20km',
    dp: '+1.1k',
    region: 'Ossau',
    maxAlt: '2260m',
    difficulty: 2,
    color: '#c8502a',
    cardElevPath:
      'M0,52 L40,48 L80,42 L120,30 L160,20 L200,15 L220,12 L240,14 L260,8 L280,10 L310,5 L340,8 L360,20 L380,18 L400,22 L400,60 L0,60 Z',
    detailElevPath:
      'M0,48 L40,42 L80,30 L120,18 L155,8 L170,6 L200,10 L230,12 L255,6 L275,4 L290,6 L320,14 L350,20 L380,30 L400,38 L400,60 L0,60 Z',
    trekDays: [
      {
        title: 'Jour 1 · Caillou de Soques → Lac Artouste · Départ 09h00',
        stages: [
          { name: 'Caillou de Soques', dist: '0km', alt: '1400m', dp: '—', time: '09h00' },
          { name: 'Plaine Soussouéou', dist: '3.5km', alt: '1420m', dp: '+30m', time: '09h59', badges: ['water'] },
          { name: 'Col du Lurien', dist: '7.5km', alt: '2005m', dp: '+640m', time: '13h07' },
          {
            name: "Lac d'Artouste",
            dist: '11km',
            alt: '1997m',
            dp: '+680m',
            time: '15h24',
            badges: ['biv', 'water'],
            rowType: 'biv',
          },
        ],
      },
      {
        title: 'Jour 2 · Train + Arrémoulit → Retour · Départ train 09h00',
        stages: [
          { name: '🚂 Train lac → Sagette', dist: '—', alt: '1934m', dp: '—', time: '~10h00' },
          {
            name: 'Refuge Arrémoulit',
            dist: '3.4km',
            alt: '2260m',
            dp: '+400m',
            time: '12h20',
            badges: ['refuge'],
            rowType: 'highlight',
          },
          { name: "Lac d'Arrious", dist: '6.9km', alt: '1994m', dp: '-700m', time: '14h25', badges: ['water'] },
          { name: 'Caillou de Soques', dist: '11.9km', alt: '1400m', dp: '-1320m', time: '17h00', rowType: 'biv' },
        ],
      },
    ],
    notes: [
      { icon: '🚂', label: 'Petit train Artouste', sub: 'artouste.fr · Billet campeur · 9h–15h · ~20€' },
      { icon: '🏠', label: 'Refuge Arrémoulit', sub: '28 places · refugedarremoulit.ffcam.fr · Réserver' },
      {
        icon: '⚠️',
        label: "Passage d'Orteig (J2)",
        sub: 'Glissant par temps humide · Bâtons indispensables',
      },
    ],
  },
];
