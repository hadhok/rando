export interface Etape {
  id: number;
  numero: number;
  nom: string;
  depart: string;
  arrivee: string;
  distance: number; // km
  denivelePos: number; // m
  deniveleNeg: number; // m
  dureeEstimee: number; // heures
  difficulte: 'facile' | 'moyen' | 'difficile' | 'tres_difficile';
  description: string;
  coordDepart: { lat: number; lng: number };
  coordArrivee: { lat: number; lng: number };
}

export const ETAPES: Etape[] = [
  {
    id: 1,
    numero: 1,
    nom: 'Hendaye – Olhette',
    depart: 'Hendaye',
    arrivee: 'Olhette',
    distance: 24.5,
    denivelePos: 1190,
    deniveleNeg: 1030,
    dureeEstimee: 8,
    difficulte: 'moyen',
    description:
      'Premier pas sur le GR10. Départ de la plage d\'Hendaye, montée vers la Rhune puis descente sur Olhette. Belle mise en jambes avec vue sur l\'océan.',
    coordDepart: { lat: 43.3695, lng: -1.7794 },
    coordArrivee: { lat: 43.3167, lng: -1.6833 },
  },
  {
    id: 2,
    numero: 2,
    nom: 'Olhette – Sare',
    depart: 'Olhette',
    arrivee: 'Sare',
    distance: 11.5,
    denivelePos: 580,
    deniveleNeg: 530,
    dureeEstimee: 4.5,
    difficulte: 'facile',
    description:
      'Courte étape traversant les collines basques verdoyantes. Passage par des fermes traditionnelles. Village de Sare classé parmi les plus beaux de France.',
    coordDepart: { lat: 43.3167, lng: -1.6833 },
    coordArrivee: { lat: 43.3119, lng: -1.5847 },
  },
  {
    id: 3,
    numero: 3,
    nom: 'Sare – Ainhoa',
    depart: 'Sare',
    arrivee: 'Ainhoa',
    distance: 14,
    denivelePos: 720,
    deniveleNeg: 700,
    dureeEstimee: 5,
    difficulte: 'facile',
    description:
      'Traversée du Pays Basque profond. Les deux villages traversés sont parmi les plus beaux de France. Paysages de collines et de fougères.',
    coordDepart: { lat: 43.3119, lng: -1.5847 },
    coordArrivee: { lat: 43.3069, lng: -1.4972 },
  },
  {
    id: 4,
    numero: 4,
    nom: 'Ainhoa – Bidarray',
    depart: 'Ainhoa',
    arrivee: 'Bidarray',
    distance: 19,
    denivelePos: 1050,
    deniveleNeg: 1100,
    dureeEstimee: 7,
    difficulte: 'moyen',
    description:
      'Étape plus engagée avec passage par les crêtes d\'Iparla (1044m). Panoramas exceptionnels sur le Pays Basque. Descente raide vers Bidarray.',
    coordDepart: { lat: 43.3069, lng: -1.4972 },
    coordArrivee: { lat: 43.2753, lng: -1.3786 },
  },
  {
    id: 5,
    numero: 5,
    nom: 'Bidarray – Saint-Étienne-de-Baïgorry',
    depart: 'Bidarray',
    arrivee: 'Saint-Étienne-de-Baïgorry',
    distance: 23,
    denivelePos: 1350,
    deniveleNeg: 1350,
    dureeEstimee: 8.5,
    difficulte: 'difficile',
    description:
      'Longue étape avec le passage du col d\'Ispéguy (672m) et des crêtes Baïgura. Etape exigeante nécessitant une bonne condition physique.',
    coordDepart: { lat: 43.2753, lng: -1.3786 },
    coordArrivee: { lat: 43.1853, lng: -1.3375 },
  },
  {
    id: 6,
    numero: 6,
    nom: 'Saint-Étienne-de-Baïgorry – Saint-Jean-Pied-de-Port',
    depart: 'Saint-Étienne-de-Baïgorry',
    arrivee: 'Saint-Jean-Pied-de-Port',
    distance: 16,
    denivelePos: 800,
    deniveleNeg: 830,
    dureeEstimee: 6,
    difficulte: 'moyen',
    description:
      'Étape en direction de la célèbre ville de départ du Chemin de Saint-Jacques. Paysages de vallées basques. Saint-Jean-Pied-de-Port est un bel endroit pour se ravitailler.',
    coordDepart: { lat: 43.1853, lng: -1.3375 },
    coordArrivee: { lat: 43.1631, lng: -1.2369 },
  },
  {
    id: 7,
    numero: 7,
    nom: 'Saint-Jean-Pied-de-Port – Estérençuby',
    depart: 'Saint-Jean-Pied-de-Port',
    arrivee: 'Estérençuby',
    distance: 20,
    denivelePos: 1100,
    deniveleNeg: 950,
    dureeEstimee: 7,
    difficulte: 'moyen',
    description:
      'Montée vers la forêt d\'Orion et les plateaux. Paysages pastoraux avec troupeaux de chevaux pottok. Vue sur les Pyrénées en approche.',
    coordDepart: { lat: 43.1631, lng: -1.2369 },
    coordArrivee: { lat: 43.0967, lng: -1.1650 },
  },
  {
    id: 8,
    numero: 8,
    nom: 'Estérençuby – Logibar',
    depart: 'Estérençuby',
    arrivee: 'Logibar',
    distance: 18,
    denivelePos: 1020,
    deniveleNeg: 1020,
    dureeEstimee: 6.5,
    difficulte: 'moyen',
    description:
      'Traversée des forêts et prairies de Soule. Passage par le col d\'Abense. Arrivée aux gorges de Kakueta à proximité.',
    coordDepart: { lat: 43.0967, lng: -1.1650 },
    coordArrivee: { lat: 43.0542, lng: -0.9942 },
  },
  {
    id: 9,
    numero: 9,
    nom: 'Logibar – Arette-la-Pierre-Saint-Martin',
    depart: 'Logibar',
    arrivee: 'Arette-la-Pierre-Saint-Martin',
    distance: 26,
    denivelePos: 1820,
    deniveleNeg: 1220,
    dureeEstimee: 10,
    difficulte: 'tres_difficile',
    description:
      'Une des étapes les plus dures du GR10. Traversée du Pays de Soule avec le passage de la Haute Route. Arrivée à la station de ski. Prévoir une bonne journée.',
    coordDepart: { lat: 43.0542, lng: -0.9942 },
    coordArrivee: { lat: 43.0228, lng: -0.8378 },
  },
  {
    id: 10,
    numero: 10,
    nom: 'Arette – Lescun',
    depart: 'Arette-la-Pierre-Saint-Martin',
    arrivee: 'Lescun',
    distance: 22,
    denivelePos: 1100,
    deniveleNeg: 1600,
    dureeEstimee: 8,
    difficulte: 'difficile',
    description:
      'Descente sur le cirque de Lescun, l\'un des plus beaux paysages des Pyrénées. Village authentique avec vue sur les aiguilles d\'Ansabère.',
    coordDepart: { lat: 43.0228, lng: -0.8378 },
    coordArrivee: { lat: 42.9617, lng: -0.7608 },
  },
];

export const TOTAL_KM = ETAPES.reduce((sum, e) => sum + e.distance, 0);
export const TOTAL_DENIVELE = ETAPES.reduce((sum, e) => sum + e.denivelePos, 0);
