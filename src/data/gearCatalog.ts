import { WhoType } from './checklist';

export interface GearCatalogItem {
  id: string;
  name: string;
  brand?: string;
  weight: number; // grams
  note?: string;
  category: string; // maps to a CheckSection.section
  suggestedWho: WhoType;
  vital: boolean;
}

export const GEAR_CATALOG: GearCatalogItem[] = [
  // ── Couchage & abri ─────────────────────────────────────────────────────────
  { id: 'gc_tarp_durston',     category: 'Couchage & abri', name: 'Tarp Durston Xmid 2P',         brand: 'Durston',      weight: 500,  suggestedWho: 'shared', vital: true,  note: 'Abri ultraléger 2 personnes' },
  { id: 'gc_tarp_tarptent',    category: 'Couchage & abri', name: 'Tarptent ProTrail Li',          brand: 'Tarptent',     weight: 625,  suggestedWho: 'shared', vital: true,  note: 'Solo, double paroi' },
  { id: 'gc_tente_msr',        category: 'Couchage & abri', name: 'Tente MSR Hubba Hubba NX',     brand: 'MSR',          weight: 1720, suggestedWho: 'shared', vital: true,  note: '2 personnes, autoportante' },
  { id: 'gc_tente_big_agnes',  category: 'Couchage & abri', name: 'Tente Big Agnes Copper Spur',  brand: 'Big Agnes',    weight: 1180, suggestedWho: 'shared', vital: true,  note: '2P ultra-légère' },
  { id: 'gc_bivy',             category: 'Couchage & abri', name: 'Sac bivouac Gore-Tex',          brand: 'OR',           weight: 450,  suggestedWho: 'papa',   vital: false, note: 'Alternative au tarp' },
  { id: 'gc_sdc_down_0',       category: 'Couchage & abri', name: 'Sac de couchage duvet 0°C',    brand: 'Cumulus',      weight: 750,  suggestedWho: 'papa',   vital: true,  note: 'Confort 0°C, duvet 850fp' },
  { id: 'gc_sdc_down_5',       category: 'Couchage & abri', name: 'Sac de couchage duvet 5°C',    brand: 'Fjern',        weight: 600,  suggestedWho: 'fille',  vital: true,  note: 'Léger, confort 5°C' },
  { id: 'gc_sdc_synth',        category: 'Couchage & abri', name: 'Sac de couchage synthétique',  brand: 'Decathlon',    weight: 900,  suggestedWho: 'shared', vital: true,  note: 'Performant humide, confort 5°C' },
  { id: 'gc_sdc_liner',        category: 'Couchage & abri', name: 'Liner en soie',                                       weight: 130,  suggestedWho: 'shared', vital: false, note: '+5°C de confort, hygiène' },
  { id: 'gc_mat_neoair',       category: 'Couchage & abri', name: 'Matelas Thermarest NeoAir XLite', brand: 'Thermarest', weight: 354, suggestedWho: 'papa',   vital: false, note: 'R-value 4.2, gonflable' },
  { id: 'gc_mat_zlite',        category: 'Couchage & abri', name: 'Matelas Thermarest Z-Lite Sol', brand: 'Thermarest',  weight: 410,  suggestedWho: 'shared', vital: false, note: 'Mousse accordéon, indestructible' },
  { id: 'gc_mat_xlite_women',  category: 'Couchage & abri', name: 'Matelas NeoAir XLite Women S',  brand: 'Thermarest',  weight: 283,  suggestedWho: 'fille',  vital: false, note: 'R-value 4.5, taille S' },
  { id: 'gc_oreiller',         category: 'Couchage & abri', name: 'Oreiller gonflable',            brand: 'Sea to Summit', weight: 58,  suggestedWho: 'shared', vital: false },
  { id: 'gc_sardines_ti',      category: 'Couchage & abri', name: 'Sardines titane x6',            brand: 'MSR',          weight: 54,  suggestedWho: 'shared', vital: false },
  { id: 'gc_tendeurs',         category: 'Couchage & abri', name: 'Tendeurs x4',                                          weight: 40,  suggestedWho: 'shared', vital: false },

  // ── Navigation ──────────────────────────────────────────────────────────────
  { id: 'gc_tel_iphone',      category: 'Navigation', name: 'Téléphone + OsmAnd',           weight: 200, suggestedWho: 'papa',   vital: true,  note: 'GPX pré-chargé, mode avion' },
  { id: 'gc_gps_garmin',      category: 'Navigation', name: 'GPS Garmin inReach Mini',       brand: 'Garmin', weight: 100,  suggestedWho: 'papa',   vital: false, note: 'Tracking satellite + SOS' },
  { id: 'gc_batterie_10k',    category: 'Navigation', name: 'Batterie 10 000 mAh',           brand: 'Anker',  weight: 230,  suggestedWho: 'papa',   vital: true,  note: '2+ charges de téléphone' },
  { id: 'gc_batterie_5k',     category: 'Navigation', name: 'Batterie 5 000 mAh',            brand: 'Anker',  weight: 130,  suggestedWho: 'shared', vital: false, note: '1 charge de téléphone' },
  { id: 'gc_cable_usbc',      category: 'Navigation', name: 'Câble USB-C court',                              weight: 20,   suggestedWho: 'shared', vital: false },
  { id: 'gc_carte_ign_gr10',  category: 'Navigation', name: 'Carte IGN 1346OT',              brand: 'IGN',    weight: 80,   suggestedWho: 'shared', vital: true,  note: 'GR10 Hendaye → Larrau' },
  { id: 'gc_carte_ign_ossau', category: 'Navigation', name: 'Carte IGN 1547OT',              brand: 'IGN',    weight: 80,   suggestedWho: 'shared', vital: true,  note: 'Ossau / Vallée d\'Aspe' },
  { id: 'gc_boussole',        category: 'Navigation', name: 'Boussole Suunto A-10',          brand: 'Suunto', weight: 30,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_etanche_tel',     category: 'Navigation', name: 'Pochette étanche téléphone',                    weight: 15,   suggestedWho: 'shared', vital: false, note: 'Pluie Pyrénées garantie' },

  // ── Eau & alimentation ───────────────────────────────────────────────────────
  { id: 'gc_gourde_1l',        category: 'Eau & alimentation', name: 'Gourde souple 1L',             brand: 'Platypus',   weight: 28,   suggestedWho: 'shared', vital: true },
  { id: 'gc_gourde_soft_2l',   category: 'Eau & alimentation', name: 'Gourde souple 2L',             brand: 'Cnoc',       weight: 44,   suggestedWho: 'shared', vital: true },
  { id: 'gc_gourde_hard_1l',   category: 'Eau & alimentation', name: 'Gourde rigide 1L',             brand: 'Nalgene',    weight: 180,  suggestedWho: 'shared', vital: false, note: 'Indestructible' },
  { id: 'gc_filtre_sawyer',    category: 'Eau & alimentation', name: 'Filtre Sawyer Squeeze',        brand: 'Sawyer',     weight: 85,   suggestedWho: 'shared', vital: true,  note: 'Filtre 0.1 micron' },
  { id: 'gc_filtre_bef',       category: 'Eau & alimentation', name: 'Filtre BeFree Katadyn',        brand: 'Katadyn',    weight: 55,   suggestedWho: 'shared', vital: true,  note: 'Très rapide' },
  { id: 'gc_steripen',         category: 'Eau & alimentation', name: 'SteriPen Adventure',           brand: 'SteriPen',   weight: 90,   suggestedWho: 'papa',   vital: false, note: 'UV, backup chimique' },
  { id: 'gc_pastilles_aqua',   category: 'Eau & alimentation', name: 'Pastilles Aquatabs x30',       brand: 'Aquatabs',   weight: 15,   suggestedWho: 'papa',   vital: false, note: 'Backup urgence' },
  { id: 'gc_rechaud_msr',      category: 'Eau & alimentation', name: 'Réchaud MSR Pocket Rocket 2',  brand: 'MSR',        weight: 73,   suggestedWho: 'shared', vital: false },
  { id: 'gc_rechaud_brs',      category: 'Eau & alimentation', name: 'Réchaud BRS-3000T ultraléger', brand: 'BRS',        weight: 25,   suggestedWho: 'shared', vital: false, note: '25g seulement !' },
  { id: 'gc_gaz_100',          category: 'Eau & alimentation', name: 'Cartouche gaz 100g',           brand: 'MSR',        weight: 200,  suggestedWho: 'shared', vital: false, note: '2–3 jours pour 2' },
  { id: 'gc_gaz_250',          category: 'Eau & alimentation', name: 'Cartouche gaz 250g',           brand: 'MSR',        weight: 380,  suggestedWho: 'shared', vital: false, note: '5+ jours pour 2' },
  { id: 'gc_gamelle_ti',       category: 'Eau & alimentation', name: 'Gamelle titane 900ml',         brand: 'Snow Peak',  weight: 130,  suggestedWho: 'shared', vital: false },
  { id: 'gc_gamelle_alu',      category: 'Eau & alimentation', name: 'Gamelle alu 2P',               brand: 'GSI',        weight: 290,  suggestedWho: 'shared', vital: false },
  { id: 'gc_cuillere_ti',      category: 'Eau & alimentation', name: 'Cuillère-fourchette titane',   brand: 'Snow Peak',  weight: 23,   suggestedWho: 'shared', vital: false },
  { id: 'gc_lyophilises',      category: 'Eau & alimentation', name: 'Repas lyophilisés x8',                              weight: 1600, suggestedWho: 'shared', vital: true,  note: '2/jour × 2 pers × 2 jours' },
  { id: 'gc_barres',           category: 'Eau & alimentation', name: 'Barres énergie x12',                                weight: 600,  suggestedWho: 'shared', vital: false, note: 'Clif, Régilait, fruits secs' },
  { id: 'gc_cafe_instant',     category: 'Eau & alimentation', name: 'Café soluble x6 doses',                             weight: 30,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_sucre',            category: 'Eau & alimentation', name: 'Sucre + sel (sachets)',                              weight: 30,   suggestedWho: 'shared', vital: false },
  { id: 'gc_allumettes',       category: 'Eau & alimentation', name: 'Allumettes étanches',                               weight: 20,   suggestedWho: 'shared', vital: false },

  // ── Vêtements papa ───────────────────────────────────────────────────────────
  { id: 'gc_chaussures_p',     category: 'Vêtements papa', name: 'Chaussures trail GTX',         brand: 'Salomon',    weight: 750,  suggestedWho: 'papa',   vital: true,  note: 'Bien rodées avant départ' },
  { id: 'gc_chaussettes_meri', category: 'Vêtements papa', name: 'Chaussettes mérinos x3',       brand: 'Darn Tough', weight: 150,  suggestedWho: 'papa',   vital: true },
  { id: 'gc_pantalon_rando_p', category: 'Vêtements papa', name: 'Pantalon rando convertible',   brand: 'Decathlon',  weight: 300,  suggestedWho: 'papa',   vital: false },
  { id: 'gc_short_p',          category: 'Vêtements papa', name: 'Short de rando',                brand: 'Patagonia',  weight: 160,  suggestedWho: 'papa',   vital: false },
  { id: 'gc_tshirt_merino_p',  category: 'Vêtements papa', name: 'T-shirt mérinos x2',           brand: 'Icebreaker', weight: 200,  suggestedWho: 'papa',   vital: false },
  { id: 'gc_tshirt_synt_p',    category: 'Vêtements papa', name: 'T-shirt synthétique x2',       brand: 'Arc\'teryx',  weight: 180, suggestedWho: 'papa',   vital: false },
  { id: 'gc_polaire_p',        category: 'Vêtements papa', name: 'Polaire légère',                brand: 'Patagonia',  weight: 350,  suggestedWho: 'papa',   vital: true,  note: 'Nuits en altitude' },
  { id: 'gc_doudoune_p',       category: 'Vêtements papa', name: 'Doudoune duvet',                brand: 'Western Mountaineering', weight: 290, suggestedWho: 'papa', vital: false, note: 'Si nuits < 5°C' },
  { id: 'gc_imper_p',          category: 'Vêtements papa', name: 'Veste imperméable Gore-Tex',   brand: 'Arc\'teryx',  weight: 400, suggestedWho: 'papa',   vital: true },
  { id: 'gc_coupe_vent_p',     category: 'Vêtements papa', name: 'Coupe-vent ultraléger',        brand: 'Montane',    weight: 120,  suggestedWho: 'papa',   vital: false },
  { id: 'gc_bonnet_p',         category: 'Vêtements papa', name: 'Bonnet mérinos',               brand: 'Buff',       weight: 60,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_gants_p',          category: 'Vêtements papa', name: 'Gants fins',                   brand: 'Decathlon',  weight: 50,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_lunettes_p',       category: 'Vêtements papa', name: 'Lunettes soleil CE 3',                              weight: 30,   suggestedWho: 'papa',   vital: true,  note: 'UV intenses en altitude' },
  { id: 'gc_casquette_p',      category: 'Vêtements papa', name: 'Casquette / chapeau',                               weight: 70,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_guetres_p',        category: 'Vêtements papa', name: 'Guêtres légères',              brand: 'OR',         weight: 80,   suggestedWho: 'papa',   vital: false, note: 'Herbes hautes, boue' },
  { id: 'gc_sous_vetement_p',  category: 'Vêtements papa', name: 'Sous-vêtement technique x2',                       weight: 100,  suggestedWho: 'papa',   vital: false },

  // ── Vêtements fille ──────────────────────────────────────────────────────────
  { id: 'gc_chaussures_f',     category: 'Vêtements fille', name: 'Chaussures trail GTX',        brand: 'Salomon',    weight: 650,  suggestedWho: 'fille',  vital: true,  note: 'Bien rodées avant départ' },
  { id: 'gc_chaussettes_f',    category: 'Vêtements fille', name: 'Chaussettes mérinos x3',      brand: 'Darn Tough', weight: 120,  suggestedWho: 'fille',  vital: true },
  { id: 'gc_pantalon_f',       category: 'Vêtements fille', name: 'Pantalon rando',               brand: 'Decathlon',  weight: 250,  suggestedWho: 'fille',  vital: false },
  { id: 'gc_legging_f',        category: 'Vêtements fille', name: 'Legging de rando',             brand: 'Salomon',    weight: 170,  suggestedWho: 'fille',  vital: false },
  { id: 'gc_tshirt_merino_f',  category: 'Vêtements fille', name: 'T-shirt mérinos x2',          brand: 'Icebreaker', weight: 160,  suggestedWho: 'fille',  vital: false },
  { id: 'gc_polaire_f',        category: 'Vêtements fille', name: 'Polaire légère',               brand: 'Patagonia',  weight: 280,  suggestedWho: 'fille',  vital: true },
  { id: 'gc_doudoune_f',       category: 'Vêtements fille', name: 'Doudoune duvet',               brand: 'Decathlon',  weight: 250,  suggestedWho: 'fille',  vital: false, note: 'Option si nuits froides' },
  { id: 'gc_imper_f',          category: 'Vêtements fille', name: 'Veste imperméable',            brand: 'Quechua',    weight: 320,  suggestedWho: 'fille',  vital: true },
  { id: 'gc_bonnet_f',         category: 'Vêtements fille', name: 'Bonnet + gants fins',         brand: 'Buff',       weight: 100,  suggestedWho: 'fille',  vital: false },
  { id: 'gc_lunettes_f',       category: 'Vêtements fille', name: 'Lunettes soleil CE 3',                             weight: 25,   suggestedWho: 'fille',  vital: true },
  { id: 'gc_casquette_f',      category: 'Vêtements fille', name: 'Casquette',                                        weight: 60,   suggestedWho: 'fille',  vital: false },
  { id: 'gc_sous_vetement_f',  category: 'Vêtements fille', name: 'Sous-vêtements x2',                               weight: 80,   suggestedWho: 'fille',  vital: false },

  // ── Sécurité & santé ─────────────────────────────────────────────────────────
  { id: 'gc_trousse_1',        category: 'Sécurité & santé', name: 'Trousse premiers secours',   brand: 'Adventure Medical', weight: 200, suggestedWho: 'shared', vital: true,  note: 'Pansements, bandes, désinfectant' },
  { id: 'gc_tiques',           category: 'Sécurité & santé', name: 'Pince à tiques x2',                                     weight: 20,  suggestedWho: 'shared', vital: true },
  { id: 'gc_ibuprofene',       category: 'Sécurité & santé', name: 'Ibuprofène',                                            weight: 30,  suggestedWho: 'papa',   vital: true },
  { id: 'gc_paracetamol',      category: 'Sécurité & santé', name: 'Paracétamol',                                           weight: 30,  suggestedWho: 'papa',   vital: true },
  { id: 'gc_ampoules',         category: 'Sécurité & santé', name: 'Compeed ampoules',            brand: 'Compeed',          weight: 30,  suggestedWho: 'shared', vital: true,  note: 'Indispensable longues distances' },
  { id: 'gc_antiseptique',     category: 'Sécurité & santé', name: 'Antiseptique cutané',                                   weight: 40,  suggestedWho: 'shared', vital: true },
  { id: 'gc_bandes',           category: 'Sécurité & santé', name: 'Bandes élastiques x2',                                  weight: 60,  suggestedWho: 'papa',   vital: false },
  { id: 'gc_solaire_50',       category: 'Sécurité & santé', name: 'Crème solaire SPF50',                                   weight: 100, suggestedWho: 'shared', vital: true },
  { id: 'gc_stick_solaire',    category: 'Sécurité & santé', name: 'Stick solaire lèvres + nez',                            weight: 15,  suggestedWho: 'shared', vital: true },
  { id: 'gc_frontale_petz',    category: 'Sécurité & santé', name: 'Frontale Petzl Actik',        brand: 'Petzl',            weight: 82,  suggestedWho: 'shared', vital: true,  note: '300 lm' },
  { id: 'gc_frontale_zebralight', category: 'Sécurité & santé', name: 'Frontale Zebralight H53Fc', brand: 'Zebralight',     weight: 48,  suggestedWho: 'papa',   vital: true,  note: 'Ultra-légère, 530 lm' },
  { id: 'gc_piles',            category: 'Sécurité & santé', name: 'Piles AAA de rechange x3',                              weight: 35,  suggestedWho: 'shared', vital: false },
  { id: 'gc_couverture',       category: 'Sécurité & santé', name: 'Couverture de survie',                                  weight: 50,  suggestedWho: 'shared', vital: true },
  { id: 'gc_sifflet',          category: 'Sécurité & santé', name: 'Sifflet Fox 40',              brand: 'Fox 40',           weight: 15,  suggestedWho: 'shared', vital: false },
  { id: 'gc_papiers',          category: 'Sécurité & santé', name: 'Papiers d\'identité + carte vitale',                    weight: 50,  suggestedWho: 'papa',   vital: true },
  { id: 'gc_antihistaminique', category: 'Sécurité & santé', name: 'Antihistaminique',                                      weight: 20,  suggestedWho: 'papa',   vital: false, note: 'Piqûres insectes, allergies' },
  { id: 'gc_hygiene_f',        category: 'Sécurité & santé', name: 'Protections hygiéniques',                               weight: 100, suggestedWho: 'fille',  vital: true },
  { id: 'gc_genouillere',      category: 'Sécurité & santé', name: 'Genouillère légère',                                    weight: 150, suggestedWho: 'papa',   vital: false },
  { id: 'gc_carre_silicone',   category: 'Sécurité & santé', name: 'Carré Siligel anti-ampoules',                           weight: 10,  suggestedWho: 'shared', vital: false },

  // ── Divers ───────────────────────────────────────────────────────────────────
  { id: 'gc_batons_black',     category: 'Divers', name: 'Bâtons Black Diamond Distance Z', brand: 'Black Diamond', weight: 254,  suggestedWho: 'papa',   vital: true,  note: 'Pliables, indispensables descentes' },
  { id: 'gc_batons_leki',      category: 'Divers', name: 'Bâtons Leki Micro Trail Pro',     brand: 'Leki',          weight: 380,  suggestedWho: 'shared', vital: true },
  { id: 'gc_batons_trail',     category: 'Divers', name: 'Bâtons Decathlon pliables',       brand: 'Decathlon',     weight: 480,  suggestedWho: 'shared', vital: false },
  { id: 'gc_sac_papa',         category: 'Divers', name: 'Sac à dos 45L',                   brand: 'Osprey',        weight: 1200, suggestedWho: 'papa',   vital: true },
  { id: 'gc_sac_fille',        category: 'Divers', name: 'Sac à dos 30L',                   brand: 'Decathlon',     weight: 900,  suggestedWho: 'fille',  vital: true },
  { id: 'gc_housse_pluie',     category: 'Divers', name: 'Housse pluie sac à dos',                                  weight: 80,   suggestedWho: 'shared', vital: true,  note: 'Ou sac plastique épais' },
  { id: 'gc_sac_etanche',      category: 'Divers', name: 'Sacs étanches compressibles',     brand: 'Ortlieb',       weight: 90,   suggestedWho: 'shared', vital: false, note: 'Couchage + vêtements' },
  { id: 'gc_truelle',          category: 'Divers', name: 'Truelle',                         brand: 'Deuce of Spades', weight: 34, suggestedWho: 'shared', vital: true,  note: 'Déjections à 50m des lacs' },
  { id: 'gc_papier_wc',        category: 'Divers', name: 'Papier toilette + sac zip',                               weight: 50,   suggestedWho: 'shared', vital: true },
  { id: 'gc_savon_bio',        category: 'Divers', name: 'Savon biodégradable 30ml',        brand: 'Dr. Bronner',   weight: 50,   suggestedWho: 'shared', vital: false },
  { id: 'gc_gel_mains',        category: 'Divers', name: 'Gel hydroalcoolique 50ml',                                weight: 60,   suggestedWho: 'shared', vital: false },
  { id: 'gc_sandales',         category: 'Divers', name: 'Sandales légères camp',           brand: 'Crocs',         weight: 200,  suggestedWho: 'shared', vital: false, note: 'Pour le camp — pieds au repos' },
  { id: 'gc_poubelle',         category: 'Divers', name: 'Sacs poubelle 20L x3',                                   weight: 30,   suggestedWho: 'shared', vital: false, note: 'LNT — ne rien laisser' },
  { id: 'gc_ecouteurs',        category: 'Divers', name: 'Écouteurs sans fil',              brand: 'Anker',         weight: 30,   suggestedWho: 'fille',  vital: false },
  { id: 'gc_carnet',           category: 'Divers', name: 'Carnet + stylo',                 brand: 'Leuchtturm',    weight: 60,   suggestedWho: 'fille',  vital: false, note: 'Journal de bivouac' },
  { id: 'gc_corde_para',       category: 'Divers', name: 'Cordelette paracorde 5m',                                weight: 40,   suggestedWho: 'shared', vital: false, note: 'Utilitaire multi-usage' },
  { id: 'gc_couteau',          category: 'Divers', name: 'Couteau multifonction',           brand: 'Victorinox',    weight: 58,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_pince_multi',      category: 'Divers', name: 'Pince multifonctions légère',    brand: 'Leatherman',    weight: 74,   suggestedWho: 'papa',   vital: false },
  { id: 'gc_baume_levres',     category: 'Divers', name: 'Baume à lèvres',                                         weight: 10,   suggestedWho: 'shared', vital: false },
  { id: 'gc_ruban',            category: 'Divers', name: 'Ruban adhésif (Gorilla Tape 1m)',                        weight: 30,   suggestedWho: 'shared', vital: false, note: 'Réparations urgence' },
  { id: 'gc_kit_couture',      category: 'Divers', name: 'Kit couture minimaliste',                                weight: 15,   suggestedWho: 'shared', vital: false },
  { id: 'gc_dentifrice',       category: 'Divers', name: 'Dentifrice + brosse à dents',                           weight: 40,   suggestedWho: 'shared', vital: false },
  { id: 'gc_mouchoirs',        category: 'Divers', name: 'Mouchoirs en tissu x3',                                 weight: 30,   suggestedWho: 'shared', vital: false },
  { id: 'gc_cash',             category: 'Divers', name: 'Liquide (30–50€)',                                       weight: 10,   suggestedWho: 'papa',   vital: true,  note: 'Refuge, TAD, urgences' },
];

// All unique categories (in display order)
export const GEAR_CATALOG_CATEGORIES: string[] = [
  'Couchage & abri',
  'Navigation',
  'Eau & alimentation',
  'Vêtements papa',
  'Vêtements fille',
  'Sécurité & santé',
  'Divers',
];
