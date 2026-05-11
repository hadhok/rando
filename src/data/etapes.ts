export interface Etape {
  id: number;
  numero: number | string;
  nom: string;
  depart: string;
  arrivee: string;
  distance: number; // km
  denivelePos: number; // m
  deniveleNeg: number; // m
  dureeEstimee: number; // heures
  difficulte: 'facile' | 'moyen' | 'difficile' | 'tres_difficile';
  description: string;
  itineraire: string;       // cols, crêtes, points clés du chemin
  ravitaillement: string;   // villages et commerces
  eau: string;              // sources, fontaines, cours d'eau
  hebergement: string;      // refuges / gîtes à l'arrivée
  retourHendaye: string;    // transports pour rentrer à Hendaye
  coordDepart: { lat: number; lng: number };
  coordArrivee: { lat: number; lng: number };
}

export const ETAPES: Etape[] = [
  // ── ÉTAPE 1a ──────────────────────────────────────────────────────────────
  {
    id: 1,
    numero: '1a',
    nom: 'Hendaye – Bivouac Biriatou',
    depart: 'Hendaye',
    arrivee: 'Biriatou',
    distance: 8,
    denivelePos: 380,
    deniveleNeg: 200,
    dureeEstimee: 3,
    difficulte: 'facile',
    description:
      'Tout commence sur la plage d\'Hendaye face à l\'Atlantique. Le GR10 quitte le sable pour remonter vers le village frontière de Biriatou perché sur sa colline. Premiers lacets, premières vues sur l\'océan et les collines basques. Étape courte idéale pour les formalités de départ (crème solaire, balisage rouge-blanc).',
    itineraire:
      'Hendaye plage → quartier Sokoburu → chemin de crêtes → Col des Poiriers (467m, 1ère vue plongeante) → descente raide sur Biriatou. Chemin bien balisé, quelques passages herbeux glissants par temps humide.',
    ravitaillement:
      'Hendaye : grande surface, boulangeries, pharmacie. Biriatou : bar-épicerie (ouvert en saison), resto La Venta Burkaitz côté espagnol à 200m.',
    eau:
      'Fontaine à Hendaye plage (départ). Source au Col des Poiriers. Fontaine au centre de Biriatou.',
    hebergement:
      'Camping Larroueta à Biriatou. Bivouac toléré sur la crête nord (zone herbeuse avant le col). Gîte Le Baya à Hendaye si départ tardif.',
    retourHendaye:
      'Bus ATCRB C6 : Biriatou bourg → Hendaye direct (20 min, GRATUIT). Toutes les 1-2h en saison. Arrêt face à la mairie. Taxi : ~15€.',
    coordDepart: { lat: 43.3695, lng: -1.7794 },
    coordArrivee: { lat: 43.3542, lng: -1.7722 },
  },

  // ── ÉTAPE 1b ──────────────────────────────────────────────────────────────
  {
    id: 2,
    numero: '1b',
    nom: 'Biriatou – Olhette',
    depart: 'Biriatou',
    arrivee: 'Olhette',
    distance: 16.5,
    denivelePos: 820,
    deniveleNeg: 870,
    dureeEstimee: 5.5,
    difficulte: 'moyen',
    description:
      'L\'étape grimpe vers les contreforts de la Rhune en longeant la frontière espagnole. Les crêtes offrent des panoramas à 360° sur l\'Atlantique au nord et les premières chaînes pyrénéennes au sud. La descente sur Olhette traverse des forêts de chênes et des fougères typiques du Pays Basque.',
    itineraire:
      'Biriatou → crêtes d\'Urdazuri → flanc nord de la Rhune (900m) → Col d\'Ibardin (317m, zone frontière) → Col des Trois Fontaines → Olhette. Balises rouges et blanches constantes. Attention aux troupeaux de poneys pottok sur les crêtes.',
    ravitaillement:
      'Col d\'Ibardin : restaurants, boutiques duty-free (côté espagnol). Olhette : épicerie-tabac, bar (horaires limités hors saison).',
    eau:
      'Les Trois Fontaines (sources naturelles, eau potable). Ruisseau avant Olhette. Pas d\'eau fiable entre Biriatou et le col d\'Ibardin.',
    hebergement:
      'Gîte d\'étape d\'Olhette. Ferme-auberge Ithurburia (résa recommandée). Camping sauvage possible sur les crêtes (tente légère, vent fréquent).',
    retourHendaye:
      'Bus ATCRB C6 depuis Col d\'Ibardin/Urrugne (15 min à pied d\'Olhette) → Hendaye (25 min, GRATUIT). Taxi Olhette → Hendaye : ~22€. Covoiturage depuis le Col d\'Ibardin fréquent en saison (duty-free).',
    coordDepart: { lat: 43.3542, lng: -1.7722 },
    coordArrivee: { lat: 43.3167, lng: -1.6833 },
  },

  // ── ÉTAPE 2 ───────────────────────────────────────────────────────────────
  {
    id: 3,
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
      'Belle étape tranquille au cœur du Pays Basque profond. Le chemin longe des fermes blanches aux volets rouges, traverse des hêtraies et monte au Pas de Lizarrieta avant de descendre sur Sare, l\'un des plus beaux villages de France. Idéal pour prendre ses marques.',
    itineraire:
      'Olhette → crêtes de Mandalé → Pas de Lizarrieta (441m, col frontière) → descente par le GR10 balisé → Sare par le chemin des karsts. Terrain varié : pelouses, forêts de hêtres, sentiers rocheux.',
    ravitaillement:
      'Sare : boulangerie, épicerie, restaurants basques, marché le vendredi matin. Vente directe de fromage de brebis sur le chemin.',
    eau:
      'Ruisseau à 2 km d\'Olhette. Fontaine au Pas de Lizarrieta. Plusieurs fontaines dans Sare.',
    hebergement:
      'Sare : gîte d\'étape municipal (50 places, douches chaudes), Hôtel Arraya (charme), chambres d\'hôtes nombreuses. Camping Goyetchea.',
    retourHendaye:
      'Bus ATCRB C6 : Sare place du village → Saint-Jean-de-Luz → Hendaye (45 min, GRATUIT). Plusieurs départs/jour. Petit Train de la Rhune (touristique) jusqu\'à Ascain puis bus C6. Taxi direct : ~35€.',
    coordDepart: { lat: 43.3167, lng: -1.6833 },
    coordArrivee: { lat: 43.3119, lng: -1.5847 },
  },

  // ── ÉTAPE 3 ───────────────────────────────────────────────────────────────
  {
    id: 4,
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
      'Deux villages classés "Plus Beaux Villages de France" reliés par un chemin qui serpente entre collines et pelouses basques. La végétation est dense en forêt, aérée sur les crêtes. Ainhoa, avec ses maisons labourdines du XVIIe siècle, est un vrai bijou médiéval.',
    itineraire:
      'Sare → Col Lizuniaga (441m) → crête de Larraun → Col Meharroste → descente sur Ainhoa. Balises bien visibles. Passage par des chemins creux typiques du Labourd.',
    ravitaillement:
      'Ainhoa : boulangerie, épicerie, restaurants, pharmacie. Producteurs de piment d\'Espelette en bord de route.',
    eau:
      'Source au col Meharroste. Fontaine à Ainhoa (place centrale).',
    hebergement:
      'Ainhoa : gîte communal (réservation mairie), Hôtel Ithurria (3 étoiles, gastronomique), plusieurs chambres d\'hôtes. Camping Harazpy.',
    retourHendaye:
      'Bus ATCRB C5 : Ainhoa → Espelette → Saint-Jean-de-Luz → Hendaye (1h15, GRATUIT). Ou taxi → Cambo-les-Bains (~25€) puis SNCF → Bayonne (30 min, ~4€) → Hendaye (35 min, ~5€). Taxi direct Ainhoa → Hendaye : ~55€.',
    coordDepart: { lat: 43.3119, lng: -1.5847 },
    coordArrivee: { lat: 43.3069, lng: -1.4972 },
  },

  // ── ÉTAPE 4 ───────────────────────────────────────────────────────────────
  {
    id: 5,
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
      'Première étape vraiment montagnarde : la crête d\'Iparla (1044m) domine les gorges de la Nive et offre l\'un des plus beaux panoramas du GR10 basque. La descente sur Bidarray, village au fond des gorges, est raide. Vérifier la météo : les crêtes sont exposées au vent et aux orages.',
    itineraire:
      'Ainhoa → Col Méhatsé (708m) → Col Harrieta (687m) → Arête d\'Iparla (1044m, ↑ exposition, passerelle basque) → descente raide par le Pas de Roland → Bidarray au bord de la Nive.',
    ravitaillement:
      'Bidarray : épicerie/bar (fermeture lundi), restaurant Noblia. Aucun commerce sur l\'arête.',
    eau:
      'Ruisseau sous le Col Méhatsé. Source fiable au Col Harrieta. Pas d\'eau sur l\'arête d\'Iparla (prévoir 2L). Nive à Bidarray.',
    hebergement:
      'Bidarray : gîte d\'étape Noblia (accueil chaleureux, repas du soir), camping au bord de la Nive, ferme Ostape (luxe).',
    retourHendaye:
      'Bus ATCRB C7 : Bidarray → Cambo-les-Bains (25 min, GRATUIT), puis SNCF Cambo → Bayonne (30 min, ~4€) → Hendaye (35 min, ~5€). Total ~1h45, ~9€. Fréquence bus réduite hors saison. Taxi direct Bidarray → Hendaye : ~70€.',
    coordDepart: { lat: 43.3069, lng: -1.4972 },
    coordArrivee: { lat: 43.2753, lng: -1.3786 },
  },

  // ── ÉTAPE 5 ───────────────────────────────────────────────────────────────
  {
    id: 6,
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
      'Longue et exigeante traversée des contreforts du Pays Basque intérieur. Le col Buztanzelhay (780m) est le point haut d\'une étape qui multiplie les montées et descentes. La vallée des Aldudes s\'ouvre progressivement avec ses élevages de porcs basques (porc noir euskal txerria). Prévoir un départ tôt.',
    itineraire:
      'Bidarray → montée raide versant est → Col Buztanzelhay (780m) → crêtes de Baïgura (897m, panorama) → redescente vers Saint-Étienne via les chemins pastoraux de la vallée des Aldudes.',
    ravitaillement:
      'Vallée des Aldudes : épicerie, fromagerie. Saint-Étienne-de-Baïgorry : boulangerie, épicerie, restaurants, cave coopérative (vins d\'Irouléguy).',
    eau:
      'Sources sur les crêtes de Baïgura. Ruisseau des Aldudes. Fontaine à Saint-Étienne.',
    hebergement:
      'Saint-Étienne-de-Baïgorry : gîte d\'étape, Hôtel Arcé (piscine, bord de rivière), camping. Possibilité de bivouac sous les crêtes de Baïgura.',
    retourHendaye:
      'Bus ATCRB B3 : Saint-Étienne → Saint-Jean-Pied-de-Port (20 min, GRATUIT), puis SNCF → Bayonne (1h15, ~10€) → Hendaye (35 min, ~5€). Total ~2h30, ~15€. Taxi Saint-Étienne → Bayonne : ~90€ puis train.',
    coordDepart: { lat: 43.2753, lng: -1.3786 },
    coordArrivee: { lat: 43.1853, lng: -1.3375 },
  },

  // ── ÉTAPE 6 ───────────────────────────────────────────────────────────────
  {
    id: 7,
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
      'Étape de transition vers la porte des Pyrénées. Le chemin longe la Nive de Béhérobie puis franchit les premières crêtes avant de descendre sur Saint-Jean-Pied-de-Port, point de départ du Camino de Santiago. Ville animée, chargée d\'histoire, idéale pour se ravitailler avant les étapes du Pays de Soule.',
    itineraire:
      'Saint-Étienne → remonter la Nive de Béhérobie → Col de Burdincurutcheta (1135m) → descente boisée par le Valcarlos → Saint-Jean-Pied-de-Port (Porte d\'Espagne).',
    ravitaillement:
      'Saint-Jean-Pied-de-Port : toutes commodités (supermarchés, pharmacie, médecin, banque). Marchés lundi et mercredi. Nombreux restaurants basques.',
    eau:
      'Nive de Béhérobie (purifier). Source au col. Fontaine à Saint-Jean.',
    hebergement:
      'Saint-Jean-Pied-de-Port : large choix (auberges de pèlerins, gîtes, hôtels). Réservation impérative en juillet-août. Gîte Compostelle recommandé.',
    retourHendaye:
      'SNCF depuis la gare (centre-ville) : Saint-Jean-Pied-de-Port → Bayonne (1h15, ~10€) → Hendaye (35 min, ~5€). 5-6 trains/jour. Horaires sur sncf-connect.com. Total ~2h, ~15€. Option rapide : taxi → Bayonne (~80€) puis train.',
    coordDepart: { lat: 43.1853, lng: -1.3375 },
    coordArrivee: { lat: 43.1631, lng: -1.2369 },
  },

  // ── ÉTAPE 7 ───────────────────────────────────────────────────────────────
  {
    id: 8,
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
      'Remontée vers les plateaux de Soule. Le chemin quitte le monde du Camino pour entrer dans des zones plus sauvages et moins fréquentées. Troupeaux de moutons, pottoks, vautours fauves. Les forêts d\'Orion et de Phagalcette sont magnifiques au printemps. Estérençuby est un minuscule village très authentique.',
    itineraire:
      'Saint-Jean → chemin de Phagalcette (rive gauche Nive) → Col d\'Erhola (918m) → forêt d\'Orion → plateau pastoral → Estérençuby. Terrain mixte : asphalte initial, puis pistes pastorales.',
    ravitaillement:
      'Estérençuby : bar-épicerie Pedro (ravitaillement limité, vérifier horaires). Faire le plein à Saint-Jean pour les 2 jours suivants.',
    eau:
      'Nombreux ruisseaux dans la forêt d\'Orion (eau généralement propre). Fontaine à Estérençuby.',
    hebergement:
      'Estérençuby : Auberge Pedro (institution du GR10, repas copieux, dortoir et chambres). Réservation conseillée. Bivouac possible sur le plateau.',
    retourHendaye:
      'Pas de bus direct. Taxi Estérençuby → Saint-Jean-Pied-de-Port (~22€, 20 min), puis SNCF → Bayonne → Hendaye (~2h, ~15€). L\'Auberge Pedro peut appeler un taxi. En été : certains gîtes organisent des navettes entre étapes, renseignez-vous. Total ~2h30, ~37€.',
    coordDepart: { lat: 43.1631, lng: -1.2369 },
    coordArrivee: { lat: 43.0967, lng: -1.1650 },
  },

  // ── ÉTAPE 8 ───────────────────────────────────────────────────────────────
  {
    id: 9,
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
      'L\'une des plus belles étapes du GR10 basque. La traversée de la Forêt d\'Iraty (plus grande hêtraie primaire d\'Europe) est inoubliable. Le Chalet Pedro (~1270m) est une halte mythique. Arrivée au fond des gorges de Kakueta, à deux pas de l\'une des plus belles gorges de France.',
    itineraire:
      'Estérençuby → montée par piste forestière → Col d\'Orgambide (1283m) → Chalet Pedro (Forêt d\'Iraty) → crêtes de Soule → descente sur Logibar (Gorges d\'Holzarté). Brume fréquente en forêt : rester sur le GR balisé.',
    ravitaillement:
      'Chalet Pedro (mi-étape) : snack, boissons, sandwichs. Logibar : bar-restaurant à l\'arrivée. Gorges de Kakueta : buvette en saison.',
    eau:
      'Très nombreux ruisseaux dans la Forêt d\'Iraty. Gave d\'Holzarté à Logibar.',
    hebergement:
      'Logibar : Auberge Logibar (gîte et restaurant, accueil depuis 1970). Pas d\'alternative proche : réservation obligatoire.',
    retourHendaye:
      'Zone isolée. Taxi Logibar → Mauléon-Licharre (~40€, 45 min), puis Transports 64 ligne 221 → Bayonne (2h, ~2€), puis bus ATCRB → Hendaye (1h, GRATUIT). Total ~4h, ~42€. L\'Auberge Logibar peut appeler un taxi. En saison : navette possible depuis Larrau (se renseigner sur place).',
    coordDepart: { lat: 43.0967, lng: -1.1650 },
    coordArrivee: { lat: 43.0542, lng: -0.9942 },
  },

  // ── ÉTAPE 9 ───────────────────────────────────────────────────────────────
  {
    id: 10,
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
      'L\'étape reine du Pays Basque-Béarn. Longue, sauvage, peu balisée par endroits, avec une traversée de hauts plateaux karstiques désertiques. Le Col d\'Anaye (1873m) offre une vue vertigineuse sur les canyons de Holzarté et Kakueta. Terrain de chasse des isards. Départ impératif à l\'aube.',
    itineraire:
      'Logibar → passerelle d\'Holzarté (gorge à 180m de haut !) → montée de Aydius → plateau d\'Anaye → Col d\'Anaye (1873m) → traversée du karst de la Pierre-Saint-Martin → Arette-PSM. Orientiation sur plateau : utiliser boussole/GPS.',
    ravitaillement:
      'Aucun commerce entre Logibar et Arette (32 km). Emporter 2 jours de nourriture. Arette-PSM : buvette de la station en saison, sinon rien.',
    eau:
      'Lavoir de Logibar. Ruisseau sous la passerelle. Ensuite RIEN sur le plateau karstique (eau s\'infiltre dans le calcaire) sur 15 km. Prévoir 3L minimum au départ du plateau.',
    hebergement:
      'Arette-PSM : refuge d\'étape de la Pierre-Saint-Martin (géré par le CAF, dortoir). Réservation obligatoire. Bivouac possible sur le plateau (vent fort).',
    retourHendaye:
      'Taxi Arette-PSM → Oloron-Sainte-Marie (~42€, 45 min), puis SNCF Oloron → Pau (40 min, ~7€) → Bayonne (1h, ~17€) → Hendaye (35 min, ~5€). Peu de trains en gare d\'Oloron : vérifier horaires SNCF. Total ~5h, ~71€. Covoiturage Blablacar depuis Oloron possible en été.',
    coordDepart: { lat: 43.0542, lng: -0.9942 },
    coordArrivee: { lat: 43.0228, lng: -0.8378 },
  },

  // ── ÉTAPE 10 ──────────────────────────────────────────────────────────────
  {
    id: 11,
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
      'L\'entrée dans les vraies Pyrénées. Le Col de Pau (~1942m) ouvre sur le Cirque de Lescun, l\'un des panoramas les plus saisissants de toute la chaîne. Les Aiguilles d\'Ansabère (2377m) dominent le village. Lescun est un belvédère naturel suspendu au-dessus du gave d\'Aspe.',
    itineraire:
      'Arette-PSM → Col de Pau (1942m, vue 360° sur les hauts sommets) → crêtes de Baralet → descente sur les pâturages de Lescun → village perché de Lescun (900m). Chemin exposé entre le col et Lescun.',
    ravitaillement:
      'Lescun : épicerie (ouverte en saison), bar-restaurant La Bonne Auberge, fromages de brebis chez les bergers. Accès limité hors juillet-août.',
    eau:
      'Sources multiples sur les versants. Fontaine à Lescun (place).',
    hebergement:
      'Lescun : gîte d\'étape municipal (très bien équipé), Auberge du Cirque (table d\'hôte excellente), camping Le Lauzart. Bivouac dans les pâturages sous les aiguilles.',
    retourHendaye:
      'Taxi Lescun → Bedous (~15€, 15 min), puis SNCF ligne Pau-Canfranc : Bedous → Pau (50 min, ~7€) → Bayonne (1h, ~17€) → Hendaye (35 min, ~5€). Attention : seulement 2-3 départs/jour depuis Bedous, vérifier horaires SNCF la veille. Total ~4h, ~44€.',
    coordDepart: { lat: 43.0228, lng: -0.8378 },
    coordArrivee: { lat: 42.9617, lng: -0.7608 },
  },
];

export const TOTAL_KM = ETAPES.reduce((sum, e) => sum + e.distance, 0);
export const TOTAL_DENIVELE = ETAPES.reduce((sum, e) => sum + e.denivelePos, 0);
