/**
 * Programme « Haut du corps prioritaire » — 4 séances par semaine, 12 semaines.
 * Chaque exercice existe en deux versions : salle (machines / charges libres)
 * et maison (poids du corps, élastique, haltères ou sac chargé).
 */

export type Variante = { nom: string; materiel: string; execution: string };

export type Exercice = {
  id: string;
  nom: string;
  groupes: string[];
  series: number;
  reps: string;
  reposSec: number;
  salle: Variante;
  maison: Variante;
  conseil: string;
};

export type Seance = {
  id: string;
  nom: string;
  focus: string;
  dureeMin: number;
  echauffement: string[];
  exercices: Exercice[];
  finisher?: string;
};

export type Programme = {
  nom: string;
  description: string;
  joursParSemaine: number;
  seances: Seance[];
  progression: { bloc: string; semaines: string; consigne: string }[];
};

const seancePoussee: Seance = {
  id: "poussee",
  nom: "Poussée",
  focus: "Pectoraux · Épaules · Triceps",
  dureeMin: 55,
  echauffement: [
    "5 min de vélo, corde à sauter ou montées de genoux",
    "20 rotations d'épaules + 15 cercles de bras dans chaque sens",
    "1 série légère de 15 pompes lentes",
  ],
  exercices: [
    {
      id: "dev-couche",
      nom: "Développé horizontal",
      groupes: ["Pectoraux", "Triceps"],
      series: 4,
      reps: "8-10",
      reposSec: 120,
      salle: {
        nom: "Développé couché barre ou machine convergente",
        materiel: "Banc + barre, ou machine à convergence",
        execution:
          "Omoplates serrées, pieds au sol, descente contrôlée jusqu'à frôler la poitrine, poussée explosive sans décoller les fesses.",
      },
      maison: {
        nom: "Pompes lestées (sac à dos) ou pompes pieds surélevés",
        materiel: "Sol + sac à dos chargé, ou une chaise",
        execution:
          "Mains légèrement plus larges que les épaules, corps gainé en planche, descends jusqu'à 5 cm du sol en 3 secondes.",
      },
      conseil:
        "C'est l'exercice qui construit tes pecs : garde 1 à 2 répétitions en réserve et note tes charges.",
    },
    {
      id: "dev-incline",
      nom: "Développé incliné",
      groupes: ["Haut des pectoraux", "Épaules"],
      series: 3,
      reps: "10-12",
      reposSec: 90,
      salle: {
        nom: "Développé incliné haltères (banc à 30°)",
        materiel: "Banc inclinable + haltères",
        execution:
          "Coudes à 45° du buste, descends jusqu'à sentir l'étirement du haut des pecs, rapproche les haltères en haut.",
      },
      maison: {
        nom: "Pompes déclinées (pieds sur une chaise)",
        materiel: "Une chaise ou un lit",
        execution:
          "Pieds surélevés de 40 à 50 cm, mains au sol : la charge se reporte sur le haut des pectoraux et les épaules.",
      },
      conseil:
        "Le haut des pecs, c'est ce qui donne le volume visible sous un t-shirt. Ne le saute jamais.",
    },
    {
      id: "dev-epaules",
      nom: "Développé épaules",
      groupes: ["Deltoïdes", "Triceps"],
      series: 3,
      reps: "8-12",
      reposSec: 90,
      salle: {
        nom: "Développé militaire barre ou machine épaules",
        materiel: "Barre / machine à épaules",
        execution:
          "Debout ou assis dos calé, abdos serrés, pousse à la verticale sans cambrer le bas du dos.",
      },
      maison: {
        nom: "Pike push-up (pompes en V) ou développé élastique",
        materiel: "Sol, ou un élastique sous les pieds",
        execution:
          "Fessiers hauts, tête vers le sol entre les mains, pousse jusqu'à bras tendus. Version élastique : bandes sous les pieds, poussée verticale.",
      },
      conseil:
        "Des épaules larges rendent la taille plus fine visuellement. Priorité pour ton objectif silhouette.",
    },
    {
      id: "ecarte",
      nom: "Écartés / isolation pectoraux",
      groupes: ["Pectoraux"],
      series: 3,
      reps: "12-15",
      reposSec: 60,
      salle: {
        nom: "Écartés à la poulie vis-à-vis ou pec-deck",
        materiel: "Poulies ou machine pec-deck",
        execution:
          "Léger fléchissement des coudes fixé, amène les mains l'une vers l'autre et serre 1 seconde en fin de mouvement.",
      },
      maison: {
        nom: "Écartés élastique ou pompes prise large lente",
        materiel: "Élastique passé dans le dos, sinon rien",
        execution:
          "Élastique dans le dos, bras semi-tendus, referme devant la poitrine. Sans élastique : pompes larges en 4 secondes de descente.",
      },
      conseil: "Cherche la sensation de brûlure, pas la charge.",
    },
    {
      id: "triceps",
      nom: "Triceps",
      groupes: ["Triceps"],
      series: 3,
      reps: "10-15",
      reposSec: 60,
      salle: {
        nom: "Extensions à la poulie haute + dips machine",
        materiel: "Poulie haute avec corde",
        execution:
          "Coudes collés au corps et immobiles, seul l'avant-bras bouge, extension complète en fin de course.",
      },
      maison: {
        nom: "Dips entre deux chaises ou pompes diamant",
        materiel: "Deux chaises stables, ou le sol",
        execution:
          "Dips : mains sur les assises, descends jusqu'à 90° au coude. Diamant : mains jointes sous la poitrine.",
      },
      conseil:
        "Le triceps représente les deux tiers du volume du bras : c'est lui qui fait grossir tes bras, pas le biceps.",
    },
    {
      id: "gainage-poussee",
      nom: "Gainage ventral",
      groupes: ["Abdominaux", "Ceinture"],
      series: 3,
      reps: "40-60 sec",
      reposSec: 45,
      salle: {
        nom: "Planche sur coudes + planche avec charge sur le dos",
        materiel: "Tapis, disque léger",
        execution:
          "Corps aligné des talons à la tête, fessiers et abdos serrés, respiration continue.",
      },
      maison: {
        nom: "Planche sur coudes + planche latérale",
        materiel: "Aucun",
        execution:
          "Ne creuse pas le bas du dos. Si c'est trop facile, lève un pied pendant 10 secondes de chaque côté.",
      },
      conseil:
        "Le gainage ne fait pas fondre le ventre à lui seul, mais il tient la sangle abdominale et redresse la posture.",
    },
  ],
  finisher: "2 tours : 15 pompes + 30 sec de gainage, 60 sec de repos entre les tours.",
};

const seanceTirage: Seance = {
  id: "tirage",
  nom: "Tirage",
  focus: "Dos · Biceps",
  dureeMin: 55,
  echauffement: [
    "5 min de rameur, corde à sauter ou marche rapide",
    "15 rotations d'épaules + 15 tirages élastique légers",
    "1 série légère de 10 tractions assistées ou rowings",
  ],
  exercices: [
    {
      id: "traction",
      nom: "Tirage vertical",
      groupes: ["Dorsaux", "Biceps"],
      series: 4,
      reps: "6-10",
      reposSec: 120,
      salle: {
        nom: "Tractions ou tirage vertical à la poulie haute",
        materiel: "Barre de traction / poulie haute",
        execution:
          "Prise large, descends les épaules avant de tirer, amène la poitrine vers la barre, contrôle la descente en 3 secondes.",
      },
      maison: {
        nom: "Tractions à une barre de porte, ou tirage élastique haut",
        materiel: "Barre de porte, ou élastique fixé en hauteur",
        execution:
          "Sans barre : élastique accroché en haut d'une porte, à genoux, tire les coudes vers les hanches.",
      },
      conseil:
        "Le dos large est ce qui donne la forme en V et fait paraître le ventre plus plat. Exercice numéro un du programme.",
    },
    {
      id: "rowing",
      nom: "Rowing horizontal",
      groupes: ["Dorsaux", "Trapèzes", "Biceps"],
      series: 4,
      reps: "8-12",
      reposSec: 100,
      salle: {
        nom: "Rowing barre buste penché ou machine T-bar",
        materiel: "Barre / machine de rowing",
        execution:
          "Dos plat, buste à 45°, tire la barre vers le nombril, serre les omoplates 1 seconde.",
      },
      maison: {
        nom: "Rowing australien sous une table, ou rowing sac à dos",
        materiel: "Table solide, ou sac à dos chargé",
        execution:
          "Allongé sous une table, mains sur le bord, corps gainé, tire la poitrine vers la table. Version sac : un bras à la fois, appui sur une chaise.",
      },
      conseil: "Tire avec les coudes, pas avec les mains : tu sentiras le dos et pas les bras.",
    },
    {
      id: "tirage-horizontal",
      nom: "Tirage horizontal serré",
      groupes: ["Dos", "Milieu du dos"],
      series: 3,
      reps: "10-12",
      reposSec: 75,
      salle: {
        nom: "Tirage horizontal poulie basse, prise serrée",
        materiel: "Poulie basse + poignée en V",
        execution:
          "Buste droit et immobile, ramène les mains au nombril, ne balance pas le torse.",
      },
      maison: {
        nom: "Tirage élastique assis au sol",
        materiel: "Élastique passé autour des pieds",
        execution:
          "Assis jambes tendues, élastique autour des pieds, tire vers le nombril en serrant les omoplates.",
      },
      conseil: "Épaisseur du dos : c'est ce qui tient la posture et efface le dos voûté.",
    },
    {
      id: "face-pull",
      nom: "Face pull / arrière d'épaules",
      groupes: ["Arrière d'épaules", "Trapèzes"],
      series: 3,
      reps: "15",
      reposSec: 60,
      salle: {
        nom: "Face pull à la poulie haute avec corde",
        materiel: "Poulie haute + corde",
        execution:
          "Tire la corde vers le visage, coudes hauts, écarte les mains en fin de mouvement.",
      },
      maison: {
        nom: "Face pull élastique ou oiseau buste penché",
        materiel: "Élastique, ou deux bouteilles d'eau",
        execution:
          "Élastique fixé à hauteur de visage, tire vers le front. Sinon buste penché, ouvre les bras sur les côtés.",
      },
      conseil:
        "Petit exercice, gros effet : il ouvre la poitrine et protège les épaules du développé couché.",
    },
    {
      id: "biceps",
      nom: "Curl biceps",
      groupes: ["Biceps", "Avant-bras"],
      series: 3,
      reps: "10-12",
      reposSec: 60,
      salle: {
        nom: "Curl barre EZ + curl marteau haltères",
        materiel: "Barre EZ / haltères",
        execution:
          "Coudes fixes le long du corps, monte sans balancer, descends en 3 secondes.",
      },
      maison: {
        nom: "Curl élastique ou curl sac à dos",
        materiel: "Élastique sous les pieds, ou sac chargé",
        execution:
          "Même consigne : coudes collés, contrôle la descente. Le sac se tient par les bretelles.",
      },
      conseil: "Deux séries lourdes puis une série longue en 15-20 reps pour finir en congestion.",
    },
    {
      id: "gainage-dos",
      nom: "Renforcement lombaire",
      groupes: ["Lombaires", "Fessiers"],
      series: 3,
      reps: "12 par côté",
      reposSec: 45,
      salle: {
        nom: "Extensions au banc à lombaires",
        materiel: "Banc à lombaires",
        execution: "Amplitude contrôlée, ne pars pas en hyperextension en haut.",
      },
      maison: {
        nom: "Superman + bird-dog",
        materiel: "Tapis",
        execution:
          "Bird-dog : à quatre pattes, tends bras droit et jambe gauche, tiens 2 secondes, alterne.",
      },
      conseil: "Un bas du dos solide, c'est ce qui te permettra de charger sur les squats et rowings.",
    },
  ],
  finisher: "3 x 20 secondes de suspension à la barre (grip) — ou 3 x 45 sec de gainage latéral.",
};

const seanceBas: Seance = {
  id: "bas-abdos",
  nom: "Bas du corps + Abdos",
  focus: "Jambes · Fessiers · Sangle abdominale",
  dureeMin: 50,
  echauffement: [
    "5 min de vélo ou de marche rapide",
    "20 squats à vide + 10 fentes par jambe",
    "15 ponts fessiers au sol",
  ],
  exercices: [
    {
      id: "squat",
      nom: "Squat",
      groupes: ["Quadriceps", "Fessiers"],
      series: 4,
      reps: "8-12",
      reposSec: 120,
      salle: {
        nom: "Squat barre ou presse à cuisses",
        materiel: "Rack + barre, ou presse",
        execution:
          "Pieds largeur d'épaules, descends jusqu'à cuisses parallèles au sol, dos droit, poussée par les talons.",
      },
      maison: {
        nom: "Squat gobelet avec sac à dos, ou squat bulgare",
        materiel: "Sac à dos chargé + une chaise",
        execution:
          "Sac tenu contre la poitrine. Bulgare : pied arrière sur une chaise, descends le genou avant à 90°.",
      },
      conseil:
        "Les jambes libèrent le plus d'hormones de croissance : elles servent aussi ton haut du corps.",
    },
    {
      id: "fentes",
      nom: "Fentes marchées",
      groupes: ["Quadriceps", "Fessiers", "Équilibre"],
      series: 3,
      reps: "10 par jambe",
      reposSec: 75,
      salle: {
        nom: "Fentes marchées haltères",
        materiel: "Deux haltères",
        execution: "Grand pas, genou arrière proche du sol, buste droit.",
      },
      maison: {
        nom: "Fentes au poids du corps ou sac à dos",
        materiel: "Aucun, ou sac chargé",
        execution: "Même exécution, ralentis la descente si c'est trop facile.",
      },
      conseil: "Excellent pour la dépense calorique : ça brûle beaucoup sur peu de temps.",
    },
    {
      id: "ischios",
      nom: "Chaîne postérieure",
      groupes: ["Ischio-jambiers", "Fessiers", "Lombaires"],
      series: 3,
      reps: "10-12",
      reposSec: 90,
      salle: {
        nom: "Soulevé de terre roumain ou leg curl",
        materiel: "Barre / machine à ischios",
        execution:
          "Jambes quasi tendues, pousse les hanches vers l'arrière, dos plat, descends jusqu'à mi-tibia.",
      },
      maison: {
        nom: "Hip thrust au sol + soulevé roumain sac à dos",
        materiel: "Canapé ou lit + sac chargé",
        execution:
          "Hip thrust : haut du dos sur le canapé, monte les hanches et serre les fessiers 2 secondes en haut.",
      },
      conseil: "Équilibre l'avant et l'arrière de la cuisse et protège le bas du dos.",
    },
    {
      id: "mollets",
      nom: "Mollets",
      groupes: ["Mollets"],
      series: 3,
      reps: "15-20",
      reposSec: 45,
      salle: {
        nom: "Extensions mollets debout à la machine",
        materiel: "Machine à mollets",
        execution: "Amplitude complète, pause 1 seconde en haut et en bas.",
      },
      maison: {
        nom: "Extensions mollets sur une marche",
        materiel: "Une marche d'escalier",
        execution: "Sur une jambe si c'est trop facile, descends le talon sous le niveau de la marche.",
      },
      conseil: "Beaucoup de répétitions : le mollet est un muscle endurant.",
    },
    {
      id: "abdos-circuit",
      nom: "Circuit abdos anti-ventre",
      groupes: ["Abdominaux", "Obliques"],
      series: 3,
      reps: "Circuit complet",
      reposSec: 60,
      salle: {
        nom: "Relevés de jambes suspendu + crunch à la poulie + roulette",
        materiel: "Barre de traction, poulie haute",
        execution:
          "12 relevés de jambes, 15 crunchs à la poulie à genoux, 10 roulettes — enchaînés.",
      },
      maison: {
        nom: "Relevés de jambes au sol + crunch vélo + gainage latéral",
        materiel: "Tapis",
        execution:
          "15 relevés de jambes, 20 crunchs vélo (10 par côté), 30 secondes de gainage latéral par côté.",
      },
      conseil:
        "Les abdos se voient quand le gras baisse : c'est ton alimentation qui fait 80 % du résultat ici.",
    },
  ],
  finisher: "10 minutes de marche rapide en pente, corde à sauter ou vélo, en aisance respiratoire.",
};

const seanceFullHaut: Seance = {
  id: "full-haut",
  nom: "Full haut + Cardio",
  focus: "Rappel haut du corps · Sangle · Dépense calorique",
  dureeMin: 45,
  echauffement: [
    "5 min de corde à sauter ou de vélo",
    "Cercles de bras + 10 pompes + 10 squats à vide",
  ],
  exercices: [
    {
      id: "superset-pousse-tire",
      nom: "Superset poussée / tirage",
      groupes: ["Pectoraux", "Dos"],
      series: 4,
      reps: "12 + 12",
      reposSec: 90,
      salle: {
        nom: "Développé haltères + tirage poulie, enchaînés",
        materiel: "Haltères + poulie",
        execution:
          "12 développés puis immédiatement 12 tirages, repos seulement à la fin du couple.",
      },
      maison: {
        nom: "Pompes + rowing australien, enchaînés",
        materiel: "Sol + table",
        execution: "12 pompes puis 12 rowings sous la table, sans repos entre les deux.",
      },
      conseil: "Format superset : plus de travail en moins de temps, et le cœur monte.",
    },
    {
      id: "epaules-laterales",
      nom: "Élévations latérales",
      groupes: ["Deltoïdes latéraux"],
      series: 3,
      reps: "15",
      reposSec: 45,
      salle: {
        nom: "Élévations latérales haltères ou poulie",
        materiel: "Haltères légers",
        execution:
          "Monte jusqu'à l'horizontale, coudes légèrement fléchis, descente lente en 3 secondes.",
      },
      maison: {
        nom: "Élévations élastique ou bouteilles d'eau",
        materiel: "Élastique / deux bouteilles de 1,5 L",
        execution: "Léger et strict : ne balance pas le buste, c'est un muscle qui aime les reps lentes.",
      },
      conseil: "Le raccourci le plus efficace pour des épaules larges.",
    },
    {
      id: "bras-superset",
      nom: "Superset biceps / triceps",
      groupes: ["Biceps", "Triceps"],
      series: 3,
      reps: "12 + 12",
      reposSec: 60,
      salle: {
        nom: "Curl haltères + extensions poulie",
        materiel: "Haltères + poulie",
        execution: "Enchaîne les deux sans repos, repos 60 secondes après le couple.",
      },
      maison: {
        nom: "Curl élastique + pompes diamant",
        materiel: "Élastique + sol",
        execution: "12 curls puis 12 pompes diamant, sans repos entre les deux.",
      },
      conseil: "Le bras répond bien au volume : c'est ta séance de rappel de la semaine.",
    },
    {
      id: "core-final",
      nom: "Circuit sangle abdominale",
      groupes: ["Abdominaux", "Obliques", "Ceinture"],
      series: 3,
      reps: "Circuit complet",
      reposSec: 60,
      salle: {
        nom: "Planche 45 sec + russian twist + mountain climbers",
        materiel: "Tapis + disque léger",
        execution: "45 sec de planche, 20 russian twists, 30 mountain climbers.",
      },
      maison: {
        nom: "Planche 45 sec + russian twist + mountain climbers",
        materiel: "Tapis",
        execution: "Identique, avec une bouteille d'eau pour les twists.",
      },
      conseil: "Enchaîne sans pause à l'intérieur du circuit, souffle bien.",
    },
  ],
  finisher:
    "15 à 20 minutes de cardio à allure modérée : marche inclinée, vélo, corde à sauter ou course lente. C'est ce bloc qui attaque le gras du ventre.",
};

export const PROGRAMME_DEFAUT: Programme = {
  nom: "Haut du corps prioritaire — 12 semaines",
  description:
    "4 séances par semaine, orientées pectoraux, dos, bras et abdos, avec un bas du corps entretenu. Chaque exercice a une version salle et une version maison sans machine.",
  joursParSemaine: 4,
  seances: [seancePoussee, seanceTirage, seanceBas, seanceFullHaut],
  progression: [
    {
      bloc: "Bloc 1 — Fondations",
      semaines: "Semaines 1 à 4",
      consigne:
        "Charges modérées, 2 à 3 répétitions en réserve. L'objectif est la technique et l'habitude : ne rate aucune séance.",
    },
    {
      bloc: "Bloc 2 — Charge",
      semaines: "Semaines 5 à 8",
      consigne:
        "Ajoute 2,5 à 5 kg (ou 2 répétitions) sur les exercices principaux dès que tu tiens le haut de la fourchette. 1 à 2 répétitions en réserve.",
    },
    {
      bloc: "Bloc 3 — Intensité",
      semaines: "Semaines 9 à 12",
      consigne:
        "Séries plus lourdes en 6-8 répétitions sur les gros exercices, finisher obligatoire, 1 répétition en réserve. Semaine 12 allégée de 40 % pour récupérer.",
    },
  ],
};

/** Ordre de rotation des séances sur la semaine (lundi, mardi, ... dimanche). */
export const PLANNING_DEFAUT_ENTRAINEMENTS = [
  { jour: 1, heure: "18:30", seanceId: "poussee" },
  { jour: 3, heure: "18:30", seanceId: "tirage" },
  { jour: 5, heure: "18:30", seanceId: "bas-abdos" },
  { jour: 6, heure: "11:00", seanceId: "full-haut" },
];
