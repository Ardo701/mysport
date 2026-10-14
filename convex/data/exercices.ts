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

/**
 * Ce avec quoi l'exercice se fait. Seul le poids du corps n'appelle pas de
 * charge : partout ailleurs, on peut noter les kilos — ceux de la barre, d'un
 * haltère, de la machine, ou du lest ajouté au poids du corps.
 *
 * `court` sert dans les résumés : « 4 × 8 · barre 80 kg ».
 */
export const MATERIELS = [
  { cle: "poids-du-corps", libelle: "Poids du corps", court: "poids du corps" },
  { cle: "lest", libelle: "Poids du corps + lest", court: "lest" },
  { cle: "barre", libelle: "Barre", court: "barre" },
  { cle: "halteres", libelle: "Haltères", court: "haltères" },
  { cle: "kettlebell", libelle: "Kettlebell", court: "kettlebell" },
  { cle: "machine", libelle: "Machine", court: "machine" },
  { cle: "poulie", libelle: "Poulie", court: "poulie" },
  { cle: "elastique", libelle: "Élastique", court: "élastique" },
  { cle: "autre", libelle: "Autre charge", court: "charge" },
] as const;

export type Materiel = (typeof MATERIELS)[number]["cle"];

export type Exercice = {
  id: string;
  nom: string;
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

/** Le quatrième élément est le matériel par défaut, ou une option de calcul pour le cardio. */
type Ligne = [id: string, nom: string, met: number, extra?: Materiel | { selonVitesse: true }];

function groupe(groupe: Groupe, mesure: Mesure, lignes: Ligne[]): Exercice[] {
  return lignes.map(([id, nom, met, extra]) => ({
    id,
    nom,
    groupe,
    mesure,
    met,
    ...(typeof extra === "string" ? { materiel: extra } : extra),
  }));
}

export const EXERCICES: Exercice[] = [
  ...groupe("Pectoraux", "series", [
    ["developpe-couche", "Développé couché", 6, "barre"],
    ["developpe-incline", "Développé incliné", 6, "barre"],
    ["developpe-decline", "Développé décliné", 6, "barre"],
    ["developpe-couche-halteres", "Développé couché aux haltères", 6, "halteres"],
    ["developpe-incline-halteres", "Développé incliné aux haltères", 6, "halteres"],
    ["developpe-machine", "Développé assis à la machine", 5, "machine"],
    ["ecarte-halteres", "Écarté aux haltères", 5, "halteres"],
    ["ecarte-poulie", "Écarté à la poulie (vis-à-vis)", 5, "poulie"],
    ["pec-deck", "Pec deck", 5, "machine"],
    ["dips", "Dips", 8, "poids-du-corps"],
    ["pompes", "Pompes", 8, "poids-du-corps"],
    ["pompes-declinees", "Pompes déclinées", 8, "poids-du-corps"],
    ["pompes-inclinees", "Pompes inclinées", 6, "poids-du-corps"],
    ["pompes-diamant", "Pompes diamant", 8, "poids-du-corps"],
    ["pompes-genoux", "Pompes sur les genoux", 5, "poids-du-corps"],
  ]),
  ...groupe("Dos", "series", [
    ["tractions", "Tractions", 8, "poids-du-corps"],
    ["tractions-supination", "Tractions en supination", 8, "poids-du-corps"],
    ["tractions-assistees", "Tractions assistées", 5, "machine"],
    ["tirage-vertical", "Tirage vertical", 5, "poulie"],
    ["tirage-horizontal", "Tirage horizontal à la poulie", 5, "poulie"],
    ["rowing-barre", "Rowing barre", 6, "barre"],
    ["rowing-haltere", "Rowing haltère à un bras", 5, "halteres"],
    ["rowing-t-bar", "Rowing T-bar", 6, "barre"],
    ["rowing-machine", "Rowing à la machine", 5, "machine"],
    ["rowing-inverse", "Rowing inversé", 6, "poids-du-corps"],
    ["souleve-de-terre", "Soulevé de terre", 6, "barre"],
    ["pull-over", "Pull-over", 5, "halteres"],
    ["face-pull", "Face pull", 4, "poulie"],
    ["shrugs", "Haussements d'épaules (shrugs)", 4, "halteres"],
    ["extensions-lombaires", "Extensions lombaires", 4, "poids-du-corps"],
    ["superman", "Superman", 3.5, "poids-du-corps"],
  ]),
  ...groupe("Épaules", "series", [
    ["developpe-militaire", "Développé militaire", 6, "barre"],
    ["developpe-halteres-assis", "Développé haltères assis", 5, "halteres"],
    ["developpe-arnold", "Développé Arnold", 5, "halteres"],
    ["elevations-laterales", "Élévations latérales", 4, "halteres"],
    ["elevations-frontales", "Élévations frontales", 4, "halteres"],
    ["oiseau", "Oiseau (buste penché)", 4, "halteres"],
    ["tirage-menton", "Tirage menton", 5, "barre"],
    ["pompes-piquees", "Pompes piquées (pike)", 8, "poids-du-corps"],
    ["pompes-poirier", "Pompes en poirier", 8, "poids-du-corps"],
  ]),
  ...groupe("Bras", "series", [
    ["curl-barre", "Curl barre", 4, "barre"],
    ["curl-halteres", "Curl haltères", 4, "halteres"],
    ["curl-marteau", "Curl marteau", 4, "halteres"],
    ["curl-pupitre", "Curl au pupitre", 4, "barre"],
    ["curl-poulie", "Curl à la poulie", 4, "poulie"],
    ["extension-triceps-poulie", "Extension triceps à la poulie", 4, "poulie"],
    ["barre-front", "Barre au front", 4, "barre"],
    ["extension-triceps-nuque", "Extension triceps au-dessus de la tête", 4, "halteres"],
    ["kickback", "Kickback triceps", 4, "halteres"],
    ["dips-banc", "Dips sur banc", 5, "poids-du-corps"],
    ["developpe-serre", "Développé couché prise serrée", 6, "barre"],
    ["curl-poignets", "Curl poignets", 3, "barre"],
  ]),
  ...groupe("Jambes et fessiers", "series", [
    ["squat", "Squat", 6, "barre"],
    ["squat-avant", "Squat avant", 6, "barre"],
    ["squat-gobelet", "Squat gobelet", 6, "halteres"],
    ["squat-poids-du-corps", "Squat au poids du corps", 5, "poids-du-corps"],
    ["squats-sautes", "Squats sautés", 8, "poids-du-corps"],
    ["hack-squat", "Hack squat", 6, "machine"],
    ["presse-cuisses", "Presse à cuisses", 5, "machine"],
    ["fentes", "Fentes", 5, "poids-du-corps"],
    ["fentes-marchees", "Fentes marchées", 6, "poids-du-corps"],
    ["fentes-bulgares", "Fentes bulgares", 6, "poids-du-corps"],
    ["souleve-roumain", "Soulevé de terre roumain", 6, "barre"],
    ["montees-sur-banc", "Montées sur banc", 6, "poids-du-corps"],
    ["leg-extension", "Leg extension", 4, "machine"],
    ["leg-curl", "Leg curl", 4, "machine"],
    ["hip-thrust", "Hip thrust", 5, "barre"],
    ["pont-fessier", "Pont fessier", 3.5, "poids-du-corps"],
    ["abducteurs", "Abducteurs à la machine", 3.5, "machine"],
    ["adducteurs", "Adducteurs à la machine", 3.5, "machine"],
    ["mollets-debout", "Mollets debout", 3.5, "machine"],
    ["mollets-assis", "Mollets assis", 3.5, "machine"],
    ["pistol-squat", "Pistol squat", 6, "poids-du-corps"],
  ]),
  ...groupe("Abdos et gainage", "series", [
    ["crunchs", "Crunchs", 3.8, "poids-du-corps"],
    ["crunchs-bicyclette", "Crunchs bicyclette", 3.8, "poids-du-corps"],
    ["sit-ups", "Sit-ups", 3.8, "poids-du-corps"],
    ["releves-jambes", "Relevés de jambes au sol", 3.8, "poids-du-corps"],
    ["releves-jambes-suspendu", "Relevés de jambes suspendu", 5, "poids-du-corps"],
    ["russian-twist", "Russian twist", 3.8, "poids-du-corps"],
    ["roue-abdominale", "Roue abdominale", 5, "poids-du-corps"],
    ["crunch-poulie", "Crunch à la poulie", 3.8, "poulie"],
    ["mountain-climbers", "Mountain climbers", 8, "poids-du-corps"],
  ]),
  ...groupe("Abdos et gainage", "maintien", [
    ["planche", "Planche", 3.8, "poids-du-corps"],
    ["gainage-lateral", "Gainage latéral", 3.8, "poids-du-corps"],
    ["hollow-body", "Hollow body", 3.8, "poids-du-corps"],
    ["chaise", "Chaise contre le mur", 3.8, "poids-du-corps"],
    ["l-sit", "L-sit", 4, "poids-du-corps"],
  ]),
  ...groupe("Corps entier", "series", [
    ["burpees", "Burpees", 8, "poids-du-corps"],
    ["kettlebell-swing", "Kettlebell swing", 8, "kettlebell"],
    ["thrusters", "Thrusters", 8, "barre"],
    ["epaule", "Épaulé (clean)", 6, "barre"],
    ["arrache", "Arraché (snatch)", 6, "barre"],
    ["epaule-jete", "Épaulé-jeté", 6, "barre"],
    ["wall-balls", "Wall balls", 8, "autre"],
    ["box-jumps", "Sauts sur box", 8, "poids-du-corps"],
    ["jumping-jacks", "Jumping jacks", 8, "poids-du-corps"],
    ["turkish-get-up", "Turkish get-up", 5, "kettlebell"],
    ["muscle-up", "Muscle-up", 8, "poids-du-corps"],
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

export function libelleMateriel(materiel: Materiel, forme: "libelle" | "court" = "libelle") {
  return MATERIELS.find((m) => m.cle === materiel)![forme];
}
