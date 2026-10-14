/**
 * Catalogue des exercices proposés à la saisie d'une séance.
 *
 * Chaque exercice dit comment il se mesure, ce qui décide des champs proposés :
 *
 *   series    séries × répétitions, charge facultative — la musculation ;
 *   maintien  séries × secondes — le gainage, tenu plutôt que répété ;
 *   duree     minutes, distance facultative — le cardio et les sports.
 *
 * Le MET est le coût énergétique de l'activité en multiple du repos, repris du
 * Compendium of Physical Activities (Ainsworth et al.). C'est un ordre de
 * grandeur : la même séance de squats coûte plus à qui la mène sans repos.
 * Pour la musculation, le Compendium ne distingue guère que l'effort modéré
 * (3,5) de l'effort soutenu (6) ; les valeurs ci-dessous s'en écartent peu,
 * plus hautes pour les gros mouvements polyarticulaires, plus basses pour
 * l'isolation d'un petit muscle.
 *
 * Les identifiants sont enregistrés avec chaque séance : ils ne doivent plus
 * changer. Un nom peut être corrigé, l'ancien libellé reste dans les séances
 * déjà saisies.
 */

export type Mesure = "series" | "maintien" | "duree";

export type Exercice = {
  id: string;
  nom: string;
  groupe: Groupe;
  mesure: Mesure;
  met: number;
  /**
   * Le coût dépend surtout de l'allure : quand durée et distance sont
   * saisies, le MET se recalcule à partir de la vitesse.
   */
  selonVitesse?: true;
};

export const GROUPES = [
  "Pectoraux",
  "Dos",
  "Épaules",
  "Bras",
  "Jambes et fessiers",
  "Abdos et gainage",
  "Corps entier",
  "Cardio",
  "Sports",
  "Mobilité",
] as const;

export type Groupe = (typeof GROUPES)[number];

type Ligne = [id: string, nom: string, met: number, options?: { selonVitesse?: true }];

function groupe(groupe: Groupe, mesure: Mesure, lignes: Ligne[]): Exercice[] {
  return lignes.map(([id, nom, met, options]) => ({ id, nom, groupe, mesure, met, ...options }));
}

export const EXERCICES: Exercice[] = [
  ...groupe("Pectoraux", "series", [
    ["developpe-couche", "Développé couché", 6],
    ["developpe-incline", "Développé incliné", 6],
    ["developpe-decline", "Développé décliné", 6],
    ["developpe-couche-halteres", "Développé couché aux haltères", 6],
    ["developpe-incline-halteres", "Développé incliné aux haltères", 6],
    ["developpe-machine", "Développé assis à la machine", 5],
    ["ecarte-halteres", "Écarté aux haltères", 5],
    ["ecarte-poulie", "Écarté à la poulie (vis-à-vis)", 5],
    ["pec-deck", "Pec deck", 5],
    ["dips", "Dips", 8],
    ["pompes", "Pompes", 8],
    ["pompes-declinees", "Pompes déclinées", 8],
    ["pompes-inclinees", "Pompes inclinées", 6],
    ["pompes-diamant", "Pompes diamant", 8],
    ["pompes-genoux", "Pompes sur les genoux", 5],
  ]),
  ...groupe("Dos", "series", [
    ["tractions", "Tractions", 8],
    ["tractions-supination", "Tractions en supination", 8],
    ["tractions-assistees", "Tractions assistées", 5],
    ["tirage-vertical", "Tirage vertical", 5],
    ["tirage-horizontal", "Tirage horizontal à la poulie", 5],
    ["rowing-barre", "Rowing barre", 6],
    ["rowing-haltere", "Rowing haltère à un bras", 5],
    ["rowing-t-bar", "Rowing T-bar", 6],
    ["rowing-machine", "Rowing à la machine", 5],
    ["rowing-inverse", "Rowing inversé", 6],
    ["souleve-de-terre", "Soulevé de terre", 6],
    ["pull-over", "Pull-over", 5],
    ["face-pull", "Face pull", 4],
    ["shrugs", "Haussements d'épaules (shrugs)", 4],
    ["extensions-lombaires", "Extensions lombaires", 4],
    ["superman", "Superman", 3.5],
  ]),
  ...groupe("Épaules", "series", [
    ["developpe-militaire", "Développé militaire", 6],
    ["developpe-halteres-assis", "Développé haltères assis", 5],
    ["developpe-arnold", "Développé Arnold", 5],
    ["elevations-laterales", "Élévations latérales", 4],
    ["elevations-frontales", "Élévations frontales", 4],
    ["oiseau", "Oiseau (buste penché)", 4],
    ["tirage-menton", "Tirage menton", 5],
    ["pompes-piquees", "Pompes piquées (pike)", 8],
    ["pompes-poirier", "Pompes en poirier", 8],
  ]),
  ...groupe("Bras", "series", [
    ["curl-barre", "Curl barre", 4],
    ["curl-halteres", "Curl haltères", 4],
    ["curl-marteau", "Curl marteau", 4],
    ["curl-pupitre", "Curl au pupitre", 4],
    ["curl-poulie", "Curl à la poulie", 4],
    ["extension-triceps-poulie", "Extension triceps à la poulie", 4],
    ["barre-front", "Barre au front", 4],
    ["extension-triceps-nuque", "Extension triceps au-dessus de la tête", 4],
    ["kickback", "Kickback triceps", 4],
    ["dips-banc", "Dips sur banc", 5],
    ["developpe-serre", "Développé couché prise serrée", 6],
    ["curl-poignets", "Curl poignets", 3],
  ]),
  ...groupe("Jambes et fessiers", "series", [
    ["squat", "Squat", 6],
    ["squat-avant", "Squat avant", 6],
    ["squat-gobelet", "Squat gobelet", 6],
    ["squat-poids-du-corps", "Squat au poids du corps", 5],
    ["squats-sautes", "Squats sautés", 8],
    ["hack-squat", "Hack squat", 6],
    ["presse-cuisses", "Presse à cuisses", 5],
    ["fentes", "Fentes", 5],
    ["fentes-marchees", "Fentes marchées", 6],
    ["fentes-bulgares", "Fentes bulgares", 6],
    ["souleve-roumain", "Soulevé de terre roumain", 6],
    ["montees-sur-banc", "Montées sur banc", 6],
    ["leg-extension", "Leg extension", 4],
    ["leg-curl", "Leg curl", 4],
    ["hip-thrust", "Hip thrust", 5],
    ["pont-fessier", "Pont fessier", 3.5],
    ["abducteurs", "Abducteurs à la machine", 3.5],
    ["adducteurs", "Adducteurs à la machine", 3.5],
    ["mollets-debout", "Mollets debout", 3.5],
    ["mollets-assis", "Mollets assis", 3.5],
    ["pistol-squat", "Pistol squat", 6],
  ]),
  ...groupe("Abdos et gainage", "series", [
    ["crunchs", "Crunchs", 3.8],
    ["crunchs-bicyclette", "Crunchs bicyclette", 3.8],
    ["sit-ups", "Sit-ups", 3.8],
    ["releves-jambes", "Relevés de jambes au sol", 3.8],
    ["releves-jambes-suspendu", "Relevés de jambes suspendu", 5],
    ["russian-twist", "Russian twist", 3.8],
    ["roue-abdominale", "Roue abdominale", 5],
    ["crunch-poulie", "Crunch à la poulie", 3.8],
    ["mountain-climbers", "Mountain climbers", 8],
  ]),
  ...groupe("Abdos et gainage", "maintien", [
    ["planche", "Planche", 3.8],
    ["gainage-lateral", "Gainage latéral", 3.8],
    ["hollow-body", "Hollow body", 3.8],
    ["chaise", "Chaise contre le mur", 3.8],
    ["l-sit", "L-sit", 4],
  ]),
  ...groupe("Corps entier", "series", [
    ["burpees", "Burpees", 8],
    ["kettlebell-swing", "Kettlebell swing", 8],
    ["thrusters", "Thrusters", 8],
    ["epaule", "Épaulé (clean)", 6],
    ["arrache", "Arraché (snatch)", 6],
    ["epaule-jete", "Épaulé-jeté", 6],
    ["wall-balls", "Wall balls", 8],
    ["box-jumps", "Sauts sur box", 8],
    ["jumping-jacks", "Jumping jacks", 8],
    ["turkish-get-up", "Turkish get-up", 5],
    ["muscle-up", "Muscle-up", 8],
  ]),
  ...groupe("Corps entier", "duree", [
    ["circuit-training", "Circuit training", 8],
    ["hiit", "HIIT", 8],
    ["crossfit", "WOD CrossFit", 8],
    ["corde-ondulatoire", "Corde ondulatoire (battle rope)", 8],
    ["marche-du-fermier", "Marche du fermier", 6],
    ["poussee-traineau", "Poussée de traîneau", 8],
  ]),
  ...groupe("Cardio", "duree", [
    ["course", "Course à pied", 9.8, { selonVitesse: true }],
    ["course-tapis", "Course sur tapis", 9.8, { selonVitesse: true }],
    ["fractionne", "Fractionné", 10.5],
    ["trail", "Trail", 9],
    ["marche", "Marche", 3.5],
    ["marche-rapide", "Marche rapide", 5],
    ["randonnee", "Randonnée", 6],
    ["velo-balade", "Vélo, balade", 4],
    ["velo-soutenu", "Vélo, allure soutenue", 8],
    ["vtt", "VTT", 8.5],
    ["velo-appartement", "Vélo d'appartement", 7],
    ["spinning", "Spinning (RPM)", 8.5],
    ["rameur", "Rameur", 7],
    ["elliptique", "Vélo elliptique", 5],
    ["stepper", "Stepper", 9],
    ["escaliers", "Montée d'escaliers", 8],
    ["corde-a-sauter", "Corde à sauter", 11],
    ["natation-crawl", "Natation, crawl", 8],
    ["natation-brasse", "Natation, brasse", 5.3],
    ["natation-tranquille", "Natation tranquille", 6],
    ["aquagym", "Aquagym", 5.3],
    ["roller", "Roller", 7.5],
    ["ski-de-fond", "Ski de fond", 9],
  ]),
  ...groupe("Sports", "duree", [
    ["football", "Football", 8],
    ["futsal", "Futsal / foot à cinq", 8],
    ["basket", "Basket", 6.5],
    ["handball", "Handball", 8],
    ["rugby", "Rugby", 8],
    ["volley", "Volley-ball", 4],
    ["beach-volley", "Beach-volley", 8],
    ["tennis", "Tennis", 7.3],
    ["padel", "Padel", 6],
    ["badminton", "Badminton", 5.5],
    ["squash", "Squash", 7.3],
    ["ping-pong", "Tennis de table", 4],
    ["boxe-sac", "Boxe, sac de frappe", 5.5],
    ["boxe-sparring", "Boxe, sparring", 7.8],
    ["arts-martiaux", "Arts martiaux", 7.5],
    ["mma-grappling", "MMA / grappling", 8],
    ["escalade", "Escalade", 7],
    ["ski-alpin", "Ski alpin", 5.3],
    ["surf", "Surf", 3],
    ["skate", "Skateboard", 5],
    ["danse", "Danse", 5],
    ["golf", "Golf", 4.8],
  ]),
  ...groupe("Mobilité", "duree", [
    ["echauffement", "Échauffement", 3.5],
    ["etirements", "Étirements", 2.3],
    ["mobilite", "Mobilité articulaire", 2.5],
    ["yoga", "Yoga", 2.5],
    ["yoga-dynamique", "Yoga dynamique (vinyasa)", 4],
    ["pilates", "Pilates", 3],
    ["rouleau", "Auto-massage au rouleau", 2],
  ]),
];

const PAR_ID = new Map(EXERCICES.map((e) => [e.id, e]));

export function exerciceDuCatalogue(id: string): Exercice | undefined {
  return PAR_ID.get(id);
}

/**
 * Identifiant des exercices hors catalogue, saisis par leur seul nom. Leur
 * coût est celui d'un effort modéré de leur famille, faute de mieux.
 */
export const ID_PERSO = "perso";

export const MET_PERSO: Record<Mesure, number> = {
  series: 5,
  maintien: 3.8,
  duree: 6,
};
