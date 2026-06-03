import { Etape } from './etapes';

export const ETAPES_BIDARRAY_SARE: Etape[] = [
  {
    id: 101,
    numero: 1,
    nom: 'Bidarray – Ainhoa',
    depart: 'Bidarray',
    arrivee: 'Ainhoa',
    distance: 19,
    denivelePos: 1100,
    deniveleNeg: 1050,
    dureeEstimee: 7,
    difficulte: 'moyen',
    description:
      'Départ du charmant village de Bidarray au bord de la Nive. Longue montée vers les crêtes d\'Iparla (1044 m), l\'un des plus beaux belvédères du Pays Basque avec ses panoramas à 360° sur les gorges et les collines. Descente progressive sur Ainhoa, l\'un des plus beaux villages de France.',
    itineraire:
      'Bidarray bourg → montée vers le Pas de Roland → arête d\'Iparla (1044 m, exposition au vent) → crêtes vers le Col Harrieta (687 m) → Col Méhatsé (708 m) → descente par les pâturages → Ainhoa. Balises GR10 blanches et rouges (sens inverse du sens canonique).',
    ravitaillement:
      'Bidarray : bar-épicerie Noblia (fermé lundi), restaurant. Aucun commerce sur l\'arête. Ainhoa : boulangerie, épicerie, restaurants, piment d\'Espelette en bord de route.',
    eau:
      'Nive à Bidarray (départ). Source fiable au Col Harrieta. Pas d\'eau sur l\'arête d\'Iparla (15 km secs : prévoir 2 L). Fontaine à Ainhoa (place centrale).',
    hebergement:
      'Ainhoa : gîte communal (réservation mairie), Hôtel Ithurria (3 étoiles), chambres d\'hôtes. Camping Harazpy.',
    retourHendaye:
      'Bus ATCRB C5 : Ainhoa → Espelette → Saint-Jean-de-Luz → Hendaye (1h15, GRATUIT). Ou taxi → Cambo-les-Bains (~25€) puis SNCF → Bayonne → Hendaye. Taxi direct Ainhoa → Hendaye : ~55€.',
    coordDepart: { lat: 43.2753, lng: -1.3786 },
    coordArrivee: { lat: 43.3069, lng: -1.4972 },
  },
  {
    id: 102,
    numero: 2,
    nom: 'Ainhoa – Sare',
    depart: 'Ainhoa',
    arrivee: 'Sare',
    distance: 14,
    denivelePos: 700,
    deniveleNeg: 720,
    dureeEstimee: 5,
    difficulte: 'facile',
    description:
      'Étape finale à travers les collines verdoyantes du Labourd. Chemins creux entre fougères et hêtraies, passage de cols frontières discrets, arrivée sur Sare dominée par la Rhune. Deux villages classés "Plus Beaux Villages de France" aux deux extrémités.',
    itineraire:
      'Ainhoa → Col Meharroste → crête de Larraun → Col Lizuniaga (441 m) → descente par le chemin des karsts → Sare. Terrain varié : sentiers herbeux, forêts de hêtres, passages rocheux. Bien balisé.',
    ravitaillement:
      'Sare : boulangerie, épicerie, restaurants basques, marché le vendredi matin. Vente directe de fromage de brebis sur le chemin.',
    eau:
      'Source au col Meharroste. Ruisseau avant Sare. Plusieurs fontaines dans le village de Sare.',
    hebergement:
      'Sare : gîte d\'étape municipal (50 places, douches chaudes), Hôtel Arraya (charme basque), Camping Goyetchea. Nombreuses chambres d\'hôtes.',
    retourHendaye:
      'Bus ATCRB C6 : Sare → Saint-Jean-de-Luz → Hendaye (45 min, GRATUIT). Plusieurs départs/jour. Ou Petit Train de la Rhune (touristique) jusqu\'à Ascain puis bus C6. Taxi direct Sare → Hendaye : ~35€.',
    coordDepart: { lat: 43.3069, lng: -1.4972 },
    coordArrivee: { lat: 43.3119, lng: -1.5847 },
  },
];

export const TOTAL_KM_BS = ETAPES_BIDARRAY_SARE.reduce((sum, e) => sum + e.distance, 0);
export const TOTAL_DENIVELE_BS = ETAPES_BIDARRAY_SARE.reduce((sum, e) => sum + e.denivelePos, 0);
