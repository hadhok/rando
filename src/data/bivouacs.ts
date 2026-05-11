export interface Bivouac {
  id: number;
  nom: string;
  description: string;
  etapeId: number;
  altitude: number;
  coordonnees: { lat: number; lng: number };
  eau: string;
  ravitaillement: string;
  conseils: string;
  panorama: string;
  difficulteAcces: 'facile' | 'moyen' | 'difficile';
}

export const BIVOUACS: Bivouac[] = [
  {
    id: 1,
    nom: 'Crête de Mandalé',
    description:
      'Replat herbeux sur la crête entre Olhette et Sare, dans les collines basques. Coucher de soleil sur l\'Atlantique et la côte basque. Terrain souple, quelques arbustes brise-vent. Idéal pour une première nuit sauvage avec vue mémorable.',
    etapeId: 3,
    altitude: 510,
    coordonnees: { lat: 43.301, lng: -1.655 },
    eau: 'Source à 400m en contrebas (direction nord). Ruisseau de Sare à 1km.',
    ravitaillement: 'Sare (3km) : boulangerie, épicerie. Olhette (4km) : bar-épicerie.',
    conseils:
      'Vent fréquent du SO — tendre la tente face aux éléments. Zone pastorale : respecter les clôtures et les troupeaux de pottoks. Brume matinale possible.',
    panorama: 'Vue à 360° sur l\'Atlantique, la Rhune, la côte basque jusqu\'à Biarritz.',
    difficulteAcces: 'facile',
  },
  {
    id: 2,
    nom: 'Arête d\'Iparla – Replat Nord',
    description:
      'Micro-replat à 980m sur l\'arête d\'Iparla, l\'un des bivouacs les plus spectaculaires du GR10 basque. Vue vertigineuse sur les gorges de la Nive et le Pays Basque intérieur. Terrain rocheux avec quelques zones herbeuses, petites tentes uniquement.',
    etapeId: 5,
    altitude: 980,
    coordonnees: { lat: 43.287, lng: -1.459 },
    eau: 'Aucune eau sur l\'arête. Ravitailler à Ainhoa (départ, 7km) ou source sous le col Méhatsé. Prévoir 2L minimum.',
    ravitaillement: 'Bidarray (8km en descente) : bar-épicerie, restaurant. Ainhoa (7km) en début d\'étape.',
    conseils:
      'Zone très exposée : ne pas bivouaquer par vent fort ou orage annoncé. Arête étroite — bien repérer la zone herbeuse avant la nuit. Déconseillé aux débutants.',
    panorama: 'Vue plongeante sur les gorges de la Nive, panorama sur les sommets basques jusqu\'en Espagne.',
    difficulteAcces: 'difficile',
  },
  {
    id: 3,
    nom: 'Plateau de Soule – Borda d\'Arradoy',
    description:
      'Vaste plateau pastoral au-dessus de Saint-Étienne-de-Baïgorry, parsemé de bordes (granges basques) abandonnées. Zone tranquille, peu fréquentée. Herbe rase et courte, idéale pour piquer la tente. Ambiance sauvage garantie.',
    etapeId: 6,
    altitude: 820,
    coordonnees: { lat: 43.210, lng: -1.340 },
    eau: 'Fontaine de la Borda d\'Arradoy (bac en pierre, eau courante). Ruisseau de la Nive de Béhérobie à 800m.',
    ravitaillement: 'Saint-Étienne-de-Baïgorry (5km) : boulangerie, épicerie, cave Irouléguy. Saint-Jean-Pied-de-Port (12km) : toutes commodités.',
    conseils:
      'Ne pas déranger les troupeaux de brebis. Le gardien local passe parfois le matin. Droit de bivouac respecté en dehors des zones cultivées.',
    panorama: 'Collines de Soule, vallée des Aldudes, premiers contreforts pyrénéens.',
    difficulteAcces: 'facile',
  },
  {
    id: 4,
    nom: 'Forêt d\'Iraty – Clairière de l\'Organbide',
    description:
      'Grande clairière en lisière de la plus grande hêtraie-sapinière d\'Europe. Atmosphère forestière unique, silence absolu, parfum de résine. Le chalet Pedro est à 2km pour l\'eau et une bière méritée. Terrain plat et humide — prévoir un bon matelas isolant.',
    etapeId: 9,
    altitude: 1250,
    coordonnees: { lat: 43.069, lng: -1.062 },
    eau: 'Ruisseau de l\'Organbide à 50m (eau pure, courant rapide). Source captée à 200m balisée en bleu.',
    ravitaillement: 'Chalet Pedro (2km sur GR10) : snack, boissons, sandwichs (en saison). Estérençuby (8km) pour épicerie.',
    conseils:
      'Sol souvent humide — enterrer les sardines. Nombreux cerfs et chevreuils la nuit. Pas d\'ours dans cette zone. Brume matinale dense et magnifique.',
    panorama: 'Canopée de hêtres centenaires, pas de vue lointaine mais ambiance forestière irréelle.',
    difficulteAcces: 'facile',
  },
  {
    id: 5,
    nom: 'Lac de Lhurs',
    description:
      'Lac de montagne glaciaire blotti sous les aiguilles d\'Ansabère, à 2km de Lescun. L\'un des plus beaux bivouacs de la chaîne. Eaux translucides, pelouses alpines, isards fréquents. Le silence de haute montagne, enfin.',
    etapeId: 11,
    altitude: 1691,
    coordonnees: { lat: 42.917, lng: -0.770 },
    eau: 'Lac de Lhurs directement (eau froide et limpide, filtrer par précaution). Ruisseau alimentant le lac au nord.',
    ravitaillement: 'Lescun (2km) : épicerie, bar, fromages. Auberge du Cirque (table d\'hôte excellente).',
    conseils:
      'Vent catabatique la nuit depuis les aiguilles — tente 4 saisons recommandée. Isards peu farouches : ne pas s\'en approcher. Zone protégée : bivouac toléré une nuit.',
    panorama: 'Aiguilles d\'Ansabère (2377m), Pic d\'Anie (2504m), Cirque de Lescun sous les étoiles.',
    difficulteAcces: 'moyen',
  },
  {
    id: 6,
    nom: 'Lac d\'Artouste',
    description:
      'Lac de barrage à 1990m, accessible par le célèbre petit train d\'Artouste ou à pied depuis Gabas. Rive nord peu fréquentée après 18h. Vue exceptionnelle sur le Pic du Midi d\'Ossau. Nuit magique au-dessus des nuages.',
    etapeId: 12,
    altitude: 1990,
    coordonnees: { lat: 42.959, lng: -0.391 },
    eau: 'Lac d\'Artouste (eau potable après filtration). Source naturelle au nord du lac.',
    ravitaillement: 'Refuge d\'Artouste (au lac) : demi-pension possible. Gabas (7km) : épicerie, bar.',
    conseils:
      'Vent fort la nuit — coins abrités à l\'est du lac. Le petit train cesse à 17h45 en saison. Froid même en été (prévoir duvet –5°C). Névés possibles jusqu\'en juillet.',
    panorama: 'Pic du Midi d\'Ossau (2884m), Pic Palas, mer de nuages sur le Béarn au coucher.',
    difficulteAcces: 'moyen',
  },
  {
    id: 7,
    nom: 'Col d\'Aubisque – Côté Ossau',
    description:
      'Replat en contrebas du col mythique des cyclistes, versant Ossau. Moins venté que le col lui-même, vue grandiose sur la vallée d\'Ossau et les sommets. Zone dégagée avec quelques zones protégées entre les crêtes.',
    etapeId: 12,
    altitude: 1600,
    coordonnees: { lat: 42.966, lng: -0.343 },
    eau: 'Source 300m sous le col côté Ossau (balisée sur IGN). Fontaine à Gourette (3km).',
    ravitaillement: 'Gourette (3km) : épicerie de station, restaurant. Col d\'Aubisque (buvette en saison).',
    conseils:
      'Col très venté — l\'abri est 200m en contrebas côté est. Vautours fauves présents (curieux mais inoffensifs). Route fermée à la circulation la nuit : silence garanti.',
    panorama: 'Pic de Ger (2613m), vallée d\'Ossau, Pic du Midi de Bigorre au loin.',
    difficulteAcces: 'facile',
  },
  {
    id: 8,
    nom: 'Vallée du Marcadau – Pont d\'Espagne',
    description:
      'Haute vallée glaciaire au-dessus du Pont d\'Espagne, paradis du bivouac dans les Hautes-Pyrénées. Cascades, lacs d\'altitude, marmotteset isards. Le refuge Wallon est à 2km pour l\'eau chaude si besoin. Ambiance Patagonie garantie.',
    etapeId: 15,
    altitude: 1520,
    coordonnees: { lat: 42.843, lng: -0.149 },
    eau: 'Gave du Marcadau (eau glaciaire, filtrer). Sources multiples dans toute la vallée.',
    ravitaillement: 'Cauterets (4km) : supérette, boulangerie, pharmacie. Refuge Wallon (2km) : repas et ravitaillement (en saison).',
    conseils:
      'Zone très fréquentée en journée — partir s\'installer en soirée. Ne pas bivouaquer dans l\'enceinte du Parc National (ligne imaginaire au-dessus du Pont d\'Espagne). Excellente eau.',
    panorama: 'Vignemale (3298m), Pic de Cambales, Glacier d\'Ossoue au loin.',
    difficulteAcces: 'facile',
  },
  {
    id: 9,
    nom: 'Cirque de Gavarnie – Plateau de la Saugue',
    description:
      'Plateau herbeux au pied du plus grand cirque d\'Europe, inscrit au Patrimoine Mondial de l\'UNESCO. La Grande Cascade (423m) tombe sous vos yeux la nuit. Expérience unique et inoubliable. Bivouac autorisé hors zone centrale du Parc.',
    etapeId: 16,
    altitude: 1380,
    coordonnees: { lat: 42.737, lng: -0.012 },
    eau: 'Gave de Gavarnie directement (eau très propre, torrent glaciaire). Fontaine au village à 3km.',
    ravitaillement: 'Gavarnie (3km) : épicerie, boulangeries, restaurants. Hôtel du Cirque (dîner possible).',
    conseils:
      'Nombreux touristes en journée — le calme revient après 20h. Vaches en liberté dans le cirque la nuit (inoffensives). Ne pas approcher la Grande Cascade sans EPI (chutes de pierres). Grand froid même en juillet.',
    panorama: 'Grande Cascade de Gavarnie, Brèche de Roland (2804m), Cirque illuminé la nuit en été.',
    difficulteAcces: 'facile',
  },
  {
    id: 10,
    nom: 'Lac d\'Oô',
    description:
      'Lac glaciaire parmi les plus photogéniques des Pyrénées avec sa cascade de 275m qui tombe en rideau. Rive sud peu fréquentée après 19h. Pelouse alpine courte, idéale pour bivouaquer sous les étoiles avec le bruit de la cascade en fond sonore.',
    etapeId: 21,
    altitude: 1504,
    coordonnees: { lat: 42.744, lng: 0.535 },
    eau: 'Lac d\'Oô (eau limpide, filtrer). Cascade d\'Espingo alimentant le lac.',
    ravitaillement: 'Refuge d\'Espingo (15min au-dessus du lac) : demi-pension, ravitaillement. Granges d\'Astau (3km) : parking, buvette.',
    conseils:
      'Zone très populaire en journée (DAY-HIKE depuis Granges d\'Astau). Bivouac possible rive sud, respecter les zones sans végétation. Brume matinale spectaculaire sur le lac.',
    panorama: 'Cascade de la Coume d\'Oô (275m), Pic Quayrat (3060m), Lac d\'Espingo au-dessus.',
    difficulteAcces: 'facile',
  },
  {
    id: 11,
    nom: 'Lac de Caillauas',
    description:
      'Lac sauvage et peu connu à 1945m, au-dessus de Loudenvielle. Absence quasi totale de touristes après la journée. Berges herbeuses et rocheuses alternées. Le silence des hautes vallées pyrénéennes à son meilleur.',
    etapeId: 20,
    altitude: 1945,
    coordonnees: { lat: 42.787, lng: 0.454 },
    eau: 'Lac de Caillauas (eau pure, filtrer). Ruisseau en amont du lac.',
    ravitaillement: 'Génos-Loudenvielle (8km en descente) : épicerie, boulangerie. Refuge de Caillauas (au lac) : ravitaillement en saison.',
    conseils:
      'Accès long (3h depuis Loudenvielle) — prévoir une étape raccourcie ou se décaler d\'une journée. Isards très présents au crépuscule. Froid nocturne important (duvet –5°C mini).',
    panorama: 'Pic du Midi de Bigorre à l\'horizon, massif Néouvielle, Pic de la Mine (3019m).',
    difficulteAcces: 'difficile',
  },
  {
    id: 12,
    nom: 'Étang de Lers',
    description:
      'Étang naturel au cœur du Massif des Trois Seigneurs, accessible en voiture mais sauvage la nuit. Forêts de pins alentour, faune riche (cerfs, renards). Le calme de l\'Ariège profonde, loin des foules.',
    etapeId: 23,
    altitude: 1108,
    coordonnees: { lat: 42.789, lng: 1.367 },
    eau: 'Étang de Lers (filtrer). Source captée à 500m sur sentier balisé.',
    ravitaillement: 'Aulus-les-Bains (12km) : épicerie, boulangerie thermale. Massat (20km) : plus grande ville de la vallée.',
    conseils:
      'Route accessible en voiture jusqu\'à l\'étang — arriver tôt pour trouver une bonne place. Zone de chasse possible hors-saison : se signaler. Terrain humide en bordure d\'étang.',
    panorama: 'Massif des Trois Seigneurs, forêts ariégeoises, étoiles loin de toute pollution lumineuse.',
    difficulteAcces: 'facile',
  },
  {
    id: 13,
    nom: 'Col de Pause – Cabane pastorale',
    description:
      'Replat herbeux au col de Pause (2079m), avec une vieille cabane pastorale non gardée offrant un abri d\'urgence. Zone de transition entre Ariège et Hautes-Pyrénées. Vent soutenu mais panorama 360° exceptionnel. L\'un des bivouacs les plus sauvages du GR10.',
    etapeId: 24,
    altitude: 2079,
    coordonnees: { lat: 42.737, lng: 1.301 },
    eau: 'Source à 200m sous le col côté Ustou (eau froide, fiable jusqu\'en octobre). Étangs saisonniers au nord du col.',
    ravitaillement: 'Aulus-les-Bains (8km) : épicerie, restaurants de la ville thermale. Ustou (12km) : épicerie de village.',
    conseils:
      'Altitude élevée : nuit froide toute l\'année (duvet –10°C en septembre). Cabane ouverte : ne rien laisser à l\'intérieur (fréquentée par les bergers). Départ tôt recommandé pour la suite.',
    panorama: 'Pic de Montcalm (3077m), Pic des Trois Seigneurs (2199m), Ariège et Haute-Garonne à portée de regard.',
    difficulteAcces: 'moyen',
  },
  {
    id: 14,
    nom: 'Étang du Comte – Haute vallée de l\'Ariège',
    description:
      'Étang sauvage à 2270m dominant Mérens-les-Vals, accessible depuis le GR10. Zone très peu fréquentée malgré la proximité de la route N20. Terrain rocheux avec micro-replats herbeux. Ours présents dans le secteur — prudence.',
    etapeId: 27,
    altitude: 2270,
    coordonnees: { lat: 42.658, lng: 1.827 },
    eau: 'Étang du Comte (eau froide, filtrer). Nombreux ruisseaux dans la montée depuis Mérens.',
    ravitaillement: 'Mérens-les-Vals (3km en descente) : épicerie, bar. Ax-les-Thermes (15km) : toutes commodités.',
    conseils:
      'Zone à ours (Pyrénées centrales) : suspendre la nourriture à un arbre ou utiliser un boîtier anti-ours. Ne pas laisser de nourriture dans la tente. Bruit pour se signaler sur le chemin.',
    panorama: 'Haute vallée de l\'Ariège, Pic Carlit (2921m) au loin, Andorre visible par temps clair.',
    difficulteAcces: 'moyen',
  },
  {
    id: 15,
    nom: 'Lac des Bouillouses',
    description:
      'Grand lac de barrage à 2015m sur le plateau du Carlit, à l\'atmosphère nordique. Entouré de pins à crochets et de lacs satellites reliés par des sentiers. Derniers rayons de soleil sur le Pic Carlit, premiers reflets du matin : inoubliable.',
    etapeId: 28,
    altitude: 2015,
    coordonnees: { lat: 42.561, lng: 1.976 },
    eau: 'Lac des Bouillouses (eau de barrage, filtrer obligatoire). Sources naturelles dans les lacs satellites.',
    ravitaillement: 'Font-Romeu (15km) : supérette, pharmacie, restaurants. Auberge des Bouillouses (au lac) : demi-pension en saison.',
    conseils:
      'Accès voiture possible (route depuis Font-Romeu) — zone populaire le week-end. S\'éloigner de 500m pour trouver calme et solitude. Moustiques en juillet — prévoir répulsif.',
    panorama: 'Pic Carlit (2921m) au coucher de soleil, constellation de petits lacs glaciaires, Pyrénées-Orientales à perte de vue.',
    difficulteAcces: 'facile',
  },
  {
    id: 16,
    nom: 'Massif du Canigou – Refuge des Cortalets',
    description:
      'Zone de bivouac autour du refuge des Cortalets (2150m), antichambre du Canigou. Paysage minéral et méditerranéen : genévriers, genêts, granit rose. Les ultimes kilomètres avant la mer. Bivouac symbolique près du sommet sacré des Catalans.',
    etapeId: 30,
    altitude: 2150,
    coordonnees: { lat: 42.524, lng: 2.436 },
    eau: 'Source à 100m du refuge (balisée). Eau au refuge (cotisation possible).',
    ravitaillement: 'Refuge des Cortalets (gardé en saison) : repas, ravitaillement. Vernet-les-Bains (8km) : toutes commodités.',
    conseils:
      'Zone ventée — le Canigou crée son propre système météo. Brume et pluie fréquentes en toutes saisons. Montée au sommet (2784m) possible tôt le matin (+1h30). Feux interdits.',
    panorama: 'Canigou (2784m), plaine du Roussillon, mer Méditerranée visible par temps clair depuis le sommet.',
    difficulteAcces: 'moyen',
  },
];
