export type WhoType = 'papa' | 'fille' | 'shared';

export interface CheckItem {
  id: string;
  name: string;
  note?: string;
  who: WhoType;
  vital: boolean;
}

export interface CheckSection {
  section: string;
  items: CheckItem[];
}

export const CHECKLIST_DATA: CheckSection[] = [
  {
    section: 'Couchage & abri',
    items: [
      { id: 'tarp', name: 'Tarp / shelter', note: 'Ex. Durston Xmid — abri pour 2', who: 'shared', vital: true },
      { id: 'sdc_papa', name: 'Sac de couchage papa', note: 'Confort 0–5°C', who: 'papa', vital: true },
      { id: 'sdc_fille', name: 'Sac de couchage fille', note: 'Confort 0–5°C — nuits 3–5°C en altitude', who: 'fille', vital: true },
      { id: 'mat_papa', name: 'Matelas papa', note: 'Thermarest NeoAir ou Z-Lite', who: 'papa', vital: false },
      { id: 'mat_fille', name: 'Matelas fille', note: 'Léger — Z-Lite ou NeoAir S', who: 'fille', vital: false },
      { id: 'sardines', name: 'Sardines + tendeurs x4', note: 'Pour fixer le tarp', who: 'shared', vital: false },
    ],
  },
  {
    section: 'Navigation',
    items: [
      { id: 'tel_gpx', name: 'Téléphone + GPX chargé', note: 'OsmAnd · GR10_Hendaye_Iraty_BIVOUAC_v2.gpx', who: 'papa', vital: true },
      { id: 'batterie', name: 'Batterie externe 10 000 mAh', note: '2 téléphones · 2 jours sans prise', who: 'papa', vital: true },
      { id: 'carte', name: 'Carte IGN papier', note: '1346OT (GR10) · 1547OT (Ossau)', who: 'shared', vital: true },
      { id: 'boussole', name: 'Boussole', note: 'Suunto A-10', who: 'papa', vital: false },
    ],
  },
  {
    section: 'Eau & alimentation',
    items: [
      { id: 'gourdes', name: 'Gourdes 1L x4 (2 chacun)', note: 'Min 2L — eau des lacs à filtrer', who: 'shared', vital: true },
      { id: 'filtre', name: 'Filtre Sawyer / Katadyn', note: 'Indispensable en bivouac', who: 'shared', vital: true },
      { id: 'pastilles', name: 'Pastilles de purification', note: 'Backup filtre', who: 'papa', vital: false },
      { id: 'rechaud', name: 'Réchaud + gaz 100g', note: 'MSR Pocket Rocket 2', who: 'shared', vital: false },
      { id: 'lyophilises', name: 'Repas lyophilisés x8', note: '2 par jour / par personne', who: 'shared', vital: true },
      { id: 'snacks', name: 'Barres / snacks x4 jours', note: 'Elle choisit les siens — motivation ado !', who: 'shared', vital: false },
      { id: 'gamelle', name: 'Gamelle + cuillères', note: 'Titane léger', who: 'shared', vital: false },
    ],
  },
  {
    section: 'Vêtements papa',
    items: [
      { id: 'chaussures_p', name: 'Chaussures GTX rodées', note: 'Obligatoire — pas de neuves !', who: 'papa', vital: true },
      { id: 'chaussettes_p', name: 'Chaussettes mérinos x2', note: 'Anti-ampoules', who: 'papa', vital: true },
      { id: 'pantalon_p', name: 'Pantalon rando', who: 'papa', vital: false },
      { id: 'tshirts_p', name: 'T-shirts techniques x2', who: 'papa', vital: false },
      { id: 'polaire_p', name: 'Polaire légère', note: 'Nuits fraîches à 2083m', who: 'papa', vital: true },
      { id: 'imper_p', name: 'Veste imperméable GTX', note: 'Orages fréquents en altitude', who: 'papa', vital: true },
      { id: 'bonnet_p', name: 'Bonnet + gants fins', who: 'papa', vital: false },
      { id: 'lunettes_p', name: 'Lunettes de soleil', note: 'UV intenses en altitude', who: 'papa', vital: true },
    ],
  },
  {
    section: 'Vêtements fille',
    items: [
      { id: 'chaussures_f', name: 'Chaussures GTX rodées', note: 'Faire 2–3 sorties avant si neuves !', who: 'fille', vital: true },
      { id: 'chaussettes_f', name: 'Chaussettes mérinos x2', who: 'fille', vital: true },
      { id: 'pantalon_f', name: 'Pantalon rando', note: 'Pas de jeans', who: 'fille', vital: false },
      { id: 'tshirts_f', name: 'T-shirts techniques x2', who: 'fille', vital: false },
      { id: 'polaire_f', name: 'Polaire légère', note: "Insiste — elle dira que c'est pas nécessaire", who: 'fille', vital: true },
      { id: 'imper_f', name: 'Veste imperméable', who: 'fille', vital: true },
      { id: 'bonnet_f', name: 'Bonnet + gants fins', note: 'Idem', who: 'fille', vital: false },
      { id: 'lunettes_f', name: 'Lunettes de soleil', who: 'fille', vital: true },
    ],
  },
  {
    section: 'Sécurité & santé',
    items: [
      { id: 'trousse', name: 'Trousse premiers secours', note: 'Pansements, bandes, désinfectant', who: 'shared', vital: true },
      { id: 'tiques', name: 'Pince à tiques x2', note: 'Prairies Pays Basque — vérification soir', who: 'shared', vital: true },
      { id: 'analgesiques', name: 'Analgésiques', note: 'Ibuprofène + paracétamol', who: 'papa', vital: true },
      { id: 'solaire', name: 'Crème solaire SPF50 x2', note: 'Une chacun — UV x2 en altitude', who: 'shared', vital: true },
      { id: 'frontale', name: 'Lampe frontale x2', note: 'Chacun la sienne', who: 'shared', vital: true },
      { id: 'survie', name: 'Couverture de survie', who: 'shared', vital: true },
      { id: 'hygiene_f', name: 'Protections hygiéniques fille', note: 'Prévoir 3–4 jours par précaution', who: 'fille', vital: true },
      { id: 'genou', name: 'Genouillère / strapping', note: 'Descentes raides', who: 'papa', vital: false },
      { id: 'sifflet', name: 'Sifflet', note: 'Sur les bretelles — urgence', who: 'shared', vital: false },
      { id: 'papiers', name: 'Papiers + carte vitale x2', note: 'Les siennes et les tiennes', who: 'papa', vital: true },
    ],
  },
  {
    section: 'Divers',
    items: [
      { id: 'batons', name: 'Bâtons de marche x2', note: 'Indispensable descentes raides — genou', who: 'shared', vital: true },
      { id: 'truelle', name: 'Truelle', note: 'Déjections à 50m des lacs', who: 'shared', vital: true },
      { id: 'papier_wc', name: 'Papier toilette + sac zip', who: 'shared', vital: true },
      { id: 'savon', name: 'Savon biodégradable', who: 'shared', vital: false },
      { id: 'poubelle', name: 'Sacs poubelle 20L x2', who: 'shared', vital: false },
      { id: 'ecouteurs', name: 'Écouteurs fille', note: "Moteur de l'ado en montée !", who: 'fille', vital: false },
      { id: 'carnet', name: 'Carnet + stylo fille', note: 'Journal de bivouac', who: 'fille', vital: false },
      { id: 'sandales', name: 'Sandales légères pour le camp', who: 'shared', vital: false },
    ],
  },
];
