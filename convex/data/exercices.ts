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
 * changer. Un nom peut être corrigé : les séances enregistrent le nom
 * français du moment, mais l'affichage reprend celui du catalogue, dans la
 * langue de l'interface.
 */

import type { Langue, Texte } from "./langues";

export type Mesure = "series" | "maintien" | "duree";

/**
 * Ce avec quoi l'exercice se fait. Seul le poids du corps n'appelle pas de
 * charge : partout ailleurs, on peut noter les kilos — ceux de la barre, d'un
 * haltère, de la machine, ou du lest ajouté au poids du corps.
 *
 * `court` sert dans les résumés : « 4 × 8 · barre 80 kg ».
 */
export const MATERIELS = [
  {
    cle: "poids-du-corps",
    libelle: { fr: "Poids du corps", en: "Bodyweight" },
    court: { fr: "poids du corps", en: "bodyweight" },
  },
  {
    cle: "lest",
    libelle: { fr: "Poids du corps + lest", en: "Bodyweight + added load" },
    court: { fr: "lest", en: "weighted" },
  },
  { cle: "barre", libelle: { fr: "Barre", en: "Barbell" }, court: { fr: "barre", en: "barbell" } },
  {
    cle: "halteres",
    libelle: { fr: "Haltères", en: "Dumbbells" },
    court: { fr: "haltères", en: "dumbbells" },
  },
  {
    cle: "kettlebell",
    libelle: { fr: "Kettlebell", en: "Kettlebell" },
    court: { fr: "kettlebell", en: "kettlebell" },
  },
  { cle: "machine", libelle: { fr: "Machine", en: "Machine" }, court: { fr: "machine", en: "machine" } },
  { cle: "poulie", libelle: { fr: "Poulie", en: "Cable" }, court: { fr: "poulie", en: "cable" } },
  {
    cle: "elastique",
    libelle: { fr: "Élastique", en: "Resistance band" },
    court: { fr: "élastique", en: "band" },
  },
  { cle: "autre", libelle: { fr: "Autre charge", en: "Other load" }, court: { fr: "charge", en: "load" } },
] as const satisfies readonly { cle: string; libelle: Texte; court: Texte }[];

export type Materiel = (typeof MATERIELS)[number]["cle"];

export type Exercice = {
  id: string;
  nom: Texte;
  groupe: Groupe;
  mesure: Mesure;
  met: number;
  /** Matériel proposé d'office, pour la musculation et le gainage. */
  materiel?: Materiel;
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

/** Les groupes s'appellent par leur nom français ; voici ce qu'ils affichent en anglais. */
const GROUPES_EN: Record<Groupe, string> = {
  Pectoraux: "Chest",
  Dos: "Back",
  Épaules: "Shoulders",
  Bras: "Arms",
  "Jambes et fessiers": "Legs and glutes",
  "Abdos et gainage": "Abs and core",
  "Corps entier": "Full body",
  Cardio: "Cardio",
  Sports: "Sports",
  Mobilité: "Mobility",
};

export function libelleGroupe(groupe: Groupe, langue: Langue): string {
  return langue === "fr" ? groupe : GROUPES_EN[groupe];
}

/** Le cinquième élément est le matériel par défaut, ou une option de calcul pour le cardio. */
type Ligne = [
  id: string,
  fr: string,
  en: string,
  met: number,
  extra?: Materiel | { selonVitesse: true },
];

function groupe(groupe: Groupe, mesure: Mesure, lignes: Ligne[]): Exercice[] {
  return lignes.map(([id, fr, en, met, extra]) => ({
    id,
    nom: { fr, en },
    groupe,
    mesure,
    met,
    ...(typeof extra === "string" ? { materiel: extra } : extra),
  }));
}

export const EXERCICES: Exercice[] = [
  ...groupe("Pectoraux", "series", [
    ["developpe-couche", "Développé couché", "Bench press", 6, "barre"],
    ["developpe-incline", "Développé incliné", "Incline bench press", 6, "barre"],
    ["developpe-decline", "Développé décliné", "Decline bench press", 6, "barre"],
    ["developpe-couche-halteres", "Développé couché aux haltères", "Dumbbell bench press", 6, "halteres"],
    ["developpe-incline-halteres", "Développé incliné aux haltères", "Incline dumbbell press", 6, "halteres"],
    ["developpe-machine", "Développé assis à la machine", "Machine chest press", 5, "machine"],
    ["ecarte-halteres", "Écarté aux haltères", "Dumbbell fly", 5, "halteres"],
    ["ecarte-poulie", "Écarté à la poulie (vis-à-vis)", "Cable crossover", 5, "poulie"],
    ["pec-deck", "Pec deck", "Pec deck", 5, "machine"],
    ["dips", "Dips", "Dips", 8, "poids-du-corps"],
    ["pompes", "Pompes", "Push-ups", 8, "poids-du-corps"],
    ["pompes-declinees", "Pompes déclinées", "Decline push-ups", 8, "poids-du-corps"],
    ["pompes-inclinees", "Pompes inclinées", "Incline push-ups", 6, "poids-du-corps"],
    ["pompes-diamant", "Pompes diamant", "Diamond push-ups", 8, "poids-du-corps"],
    ["pompes-genoux", "Pompes sur les genoux", "Knee push-ups", 5, "poids-du-corps"],
  ]),
  ...groupe("Dos", "series", [
    ["tractions", "Tractions", "Pull-ups", 8, "poids-du-corps"],
    ["tractions-supination", "Tractions en supination", "Chin-ups", 8, "poids-du-corps"],
    ["tractions-assistees", "Tractions assistées", "Assisted pull-ups", 5, "machine"],
    ["tirage-vertical", "Tirage vertical", "Lat pulldown", 5, "poulie"],
    ["tirage-horizontal", "Tirage horizontal à la poulie", "Seated cable row", 5, "poulie"],
    ["rowing-barre", "Rowing barre", "Barbell row", 6, "barre"],
    ["rowing-haltere", "Rowing haltère à un bras", "One-arm dumbbell row", 5, "halteres"],
    ["rowing-t-bar", "Rowing T-bar", "T-bar row", 6, "barre"],
    ["rowing-machine", "Rowing à la machine", "Machine row", 5, "machine"],
    ["rowing-inverse", "Rowing inversé", "Inverted row", 6, "poids-du-corps"],
    ["souleve-de-terre", "Soulevé de terre", "Deadlift", 6, "barre"],
    ["pull-over", "Pull-over", "Pullover", 5, "halteres"],
    ["face-pull", "Face pull", "Face pull", 4, "poulie"],
    ["shrugs", "Haussements d'épaules (shrugs)", "Shrugs", 4, "halteres"],
    ["extensions-lombaires", "Extensions lombaires", "Back extensions", 4, "poids-du-corps"],
    ["superman", "Superman", "Superman", 3.5, "poids-du-corps"],
  ]),
  ...groupe("Épaules", "series", [
    ["developpe-militaire", "Développé militaire", "Overhead press", 6, "barre"],
    ["developpe-halteres-assis", "Développé haltères assis", "Seated dumbbell press", 5, "halteres"],
    ["developpe-arnold", "Développé Arnold", "Arnold press", 5, "halteres"],
    ["elevations-laterales", "Élévations latérales", "Lateral raises", 4, "halteres"],
    ["elevations-frontales", "Élévations frontales", "Front raises", 4, "halteres"],
    ["oiseau", "Oiseau (buste penché)", "Rear delt fly", 4, "halteres"],
    ["tirage-menton", "Tirage menton", "Upright row", 5, "barre"],
    ["pompes-piquees", "Pompes piquées (pike)", "Pike push-ups", 8, "poids-du-corps"],
    ["pompes-poirier", "Pompes en poirier", "Handstand push-ups", 8, "poids-du-corps"],
  ]),
  ...groupe("Bras", "series", [
    ["curl-barre", "Curl barre", "Barbell curl", 4, "barre"],
    ["curl-halteres", "Curl haltères", "Dumbbell curl", 4, "halteres"],
    ["curl-marteau", "Curl marteau", "Hammer curl", 4, "halteres"],
    ["curl-pupitre", "Curl au pupitre", "Preacher curl", 4, "barre"],
    ["curl-poulie", "Curl à la poulie", "Cable curl", 4, "poulie"],
    ["extension-triceps-poulie", "Extension triceps à la poulie", "Triceps pushdown", 4, "poulie"],
    ["barre-front", "Barre au front", "Skull crushers", 4, "barre"],
    ["extension-triceps-nuque", "Extension triceps au-dessus de la tête", "Overhead triceps extension", 4, "halteres"],
    ["kickback", "Kickback triceps", "Triceps kickback", 4, "halteres"],
    ["dips-banc", "Dips sur banc", "Bench dips", 5, "poids-du-corps"],
    ["developpe-serre", "Développé couché prise serrée", "Close-grip bench press", 6, "barre"],
    ["curl-poignets", "Curl poignets", "Wrist curls", 3, "barre"],
  ]),
  ...groupe("Jambes et fessiers", "series", [
    ["squat", "Squat", "Squat", 6, "barre"],
    ["squat-avant", "Squat avant", "Front squat", 6, "barre"],
    ["squat-gobelet", "Squat gobelet", "Goblet squat", 6, "halteres"],
    ["squat-poids-du-corps", "Squat au poids du corps", "Bodyweight squat", 5, "poids-du-corps"],
    ["squats-sautes", "Squats sautés", "Jump squats", 8, "poids-du-corps"],
    ["hack-squat", "Hack squat", "Hack squat", 6, "machine"],
    ["presse-cuisses", "Presse à cuisses", "Leg press", 5, "machine"],
    ["fentes", "Fentes", "Lunges", 5, "poids-du-corps"],
    ["fentes-marchees", "Fentes marchées", "Walking lunges", 6, "poids-du-corps"],
    ["fentes-bulgares", "Fentes bulgares", "Bulgarian split squats", 6, "poids-du-corps"],
    ["souleve-roumain", "Soulevé de terre roumain", "Romanian deadlift", 6, "barre"],
    ["montees-sur-banc", "Montées sur banc", "Step-ups", 6, "poids-du-corps"],
    ["leg-extension", "Leg extension", "Leg extension", 4, "machine"],
    ["leg-curl", "Leg curl", "Leg curl", 4, "machine"],
    ["hip-thrust", "Hip thrust", "Hip thrust", 5, "barre"],
    ["pont-fessier", "Pont fessier", "Glute bridge", 3.5, "poids-du-corps"],
    ["abducteurs", "Abducteurs à la machine", "Hip abduction machine", 3.5, "machine"],
    ["adducteurs", "Adducteurs à la machine", "Hip adduction machine", 3.5, "machine"],
    ["mollets-debout", "Mollets debout", "Standing calf raises", 3.5, "machine"],
    ["mollets-assis", "Mollets assis", "Seated calf raises", 3.5, "machine"],
    ["pistol-squat", "Pistol squat", "Pistol squat", 6, "poids-du-corps"],
  ]),
  ...groupe("Abdos et gainage", "series", [
    ["crunchs", "Crunchs", "Crunches", 3.8, "poids-du-corps"],
    ["crunchs-bicyclette", "Crunchs bicyclette", "Bicycle crunches", 3.8, "poids-du-corps"],
    ["sit-ups", "Sit-ups", "Sit-ups", 3.8, "poids-du-corps"],
    ["releves-jambes", "Relevés de jambes au sol", "Lying leg raises", 3.8, "poids-du-corps"],
    ["releves-jambes-suspendu", "Relevés de jambes suspendu", "Hanging leg raises", 5, "poids-du-corps"],
    ["russian-twist", "Russian twist", "Russian twist", 3.8, "poids-du-corps"],
    ["roue-abdominale", "Roue abdominale", "Ab wheel rollout", 5, "poids-du-corps"],
    ["crunch-poulie", "Crunch à la poulie", "Cable crunch", 3.8, "poulie"],
    ["mountain-climbers", "Mountain climbers", "Mountain climbers", 8, "poids-du-corps"],
  ]),
  ...groupe("Abdos et gainage", "maintien", [
    ["planche", "Planche", "Plank", 3.8, "poids-du-corps"],
    ["gainage-lateral", "Gainage latéral", "Side plank", 3.8, "poids-du-corps"],
    ["hollow-body", "Hollow body", "Hollow body hold", 3.8, "poids-du-corps"],
    ["abdos-en-v", "Abdos en V", "V-sit hold", 3.8, "poids-du-corps"],
    ["chaise", "Chaise contre le mur", "Wall sit", 3.8, "poids-du-corps"],
    ["l-sit", "L-sit", "L-sit", 4, "poids-du-corps"],
  ]),
  ...groupe("Corps entier", "series", [
    ["burpees", "Burpees", "Burpees", 8, "poids-du-corps"],
    ["kettlebell-swing", "Kettlebell swing", "Kettlebell swing", 8, "kettlebell"],
    ["thrusters", "Thrusters", "Thrusters", 8, "barre"],
    ["epaule", "Épaulé (clean)", "Power clean", 6, "barre"],
    ["arrache", "Arraché (snatch)", "Snatch", 6, "barre"],
    ["epaule-jete", "Épaulé-jeté", "Clean and jerk", 6, "barre"],
    ["wall-balls", "Wall balls", "Wall balls", 8, "autre"],
    ["box-jumps", "Sauts sur box", "Box jumps", 8, "poids-du-corps"],
    ["jumping-jacks", "Jumping jacks", "Jumping jacks", 8, "poids-du-corps"],
    ["turkish-get-up", "Turkish get-up", "Turkish get-up", 5, "kettlebell"],
    ["muscle-up", "Muscle-up", "Muscle-up", 8, "poids-du-corps"],
  ]),
  ...groupe("Corps entier", "duree", [
    ["circuit-training", "Circuit training", "Circuit training", 8],
    ["hiit", "HIIT", "HIIT", 8],
    ["crossfit", "WOD CrossFit", "CrossFit WOD", 8],
    ["corde-ondulatoire", "Corde ondulatoire (battle rope)", "Battle ropes", 8],
    ["marche-du-fermier", "Marche du fermier", "Farmer's walk", 6],
    ["poussee-traineau", "Poussée de traîneau", "Sled push", 8],
  ]),
  ...groupe("Cardio", "duree", [
    ["course", "Course à pied", "Running", 9.8, { selonVitesse: true }],
    ["course-tapis", "Course sur tapis", "Treadmill running", 9.8, { selonVitesse: true }],
    ["fractionne", "Fractionné", "Interval running", 10.5],
    ["trail", "Trail", "Trail running", 9],
    ["marche", "Marche", "Walking", 3.5],
    ["marche-rapide", "Marche rapide", "Brisk walking", 5],
    ["randonnee", "Randonnée", "Hiking", 6],
    ["velo-balade", "Vélo, balade", "Cycling, easy pace", 4],
    ["velo-soutenu", "Vélo, allure soutenue", "Cycling, fast pace", 8],
    ["vtt", "VTT", "Mountain biking", 8.5],
    ["velo-appartement", "Vélo d'appartement", "Stationary bike", 7],
    ["spinning", "Spinning (RPM)", "Spinning", 8.5],
    ["rameur", "Rameur", "Rowing machine", 7],
    ["elliptique", "Vélo elliptique", "Elliptical trainer", 5],
    ["stepper", "Stepper", "Stair stepper", 9],
    ["escaliers", "Montée d'escaliers", "Stair climbing", 8],
    ["corde-a-sauter", "Corde à sauter", "Jump rope", 11],
    ["natation-crawl", "Natation, crawl", "Swimming, freestyle", 8],
    ["natation-brasse", "Natation, brasse", "Swimming, breaststroke", 5.3],
    ["natation-tranquille", "Natation tranquille", "Swimming, easy pace", 6],
    ["aquagym", "Aquagym", "Aqua aerobics", 5.3],
    ["roller", "Roller", "Inline skating", 7.5],
    ["ski-de-fond", "Ski de fond", "Cross-country skiing", 9],
  ]),
  ...groupe("Sports", "duree", [
    ["football", "Football", "Football (soccer)", 8],
    ["futsal", "Futsal / foot à cinq", "Futsal / five-a-side", 8],
    ["basket", "Basket", "Basketball", 6.5],
    ["handball", "Handball", "Handball", 8],
    ["rugby", "Rugby", "Rugby", 8],
    ["volley", "Volley-ball", "Volleyball", 4],
    ["beach-volley", "Beach-volley", "Beach volleyball", 8],
    ["tennis", "Tennis", "Tennis", 7.3],
    ["padel", "Padel", "Padel", 6],
    ["badminton", "Badminton", "Badminton", 5.5],
    ["squash", "Squash", "Squash", 7.3],
    ["ping-pong", "Tennis de table", "Table tennis", 4],
    ["boxe-sac", "Boxe, sac de frappe", "Boxing, heavy bag", 5.5],
    ["boxe-sparring", "Boxe, sparring", "Boxing, sparring", 7.8],
    ["arts-martiaux", "Arts martiaux", "Martial arts", 7.5],
    ["mma-grappling", "MMA / grappling", "MMA / grappling", 8],
    ["escalade", "Escalade", "Climbing", 7],
    ["ski-alpin", "Ski alpin", "Downhill skiing", 5.3],
    ["surf", "Surf", "Surfing", 3],
    ["skate", "Skateboard", "Skateboarding", 5],
    ["danse", "Danse", "Dancing", 5],
    ["golf", "Golf", "Golf", 4.8],
  ]),
  ...groupe("Mobilité", "duree", [
    ["echauffement", "Échauffement", "Warm-up", 3.5],
    ["etirements", "Étirements", "Stretching", 2.3],
    ["mobilite", "Mobilité articulaire", "Joint mobility", 2.5],
    ["yoga", "Yoga", "Yoga", 2.5],
    ["yoga-dynamique", "Yoga dynamique (vinyasa)", "Vinyasa yoga", 4],
    ["pilates", "Pilates", "Pilates", 3],
    ["rouleau", "Auto-massage au rouleau", "Foam rolling", 2],
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

/**
 * Matériel d'un exercice de force qui n'en précise pas : celui du catalogue,
 * à défaut le poids du corps. Une charge déjà notée sur un exercice au poids
 * du corps ne peut être qu'un lest. Le cardio n'a pas de matériel.
 */
export function materielParDefaut(
  exerciceId: string,
  mesure: Mesure,
  chargeKg?: number,
): Materiel | undefined {
  if (mesure === "duree") return undefined;
  const defaut = exerciceDuCatalogue(exerciceId)?.materiel ?? "poids-du-corps";
  return defaut === "poids-du-corps" && chargeKg ? "lest" : defaut;
}

export function libelleMateriel(
  materiel: Materiel,
  langue: Langue,
  forme: "libelle" | "court" = "libelle",
) {
  return MATERIELS.find((m) => m.cle === materiel)![forme][langue];
}
