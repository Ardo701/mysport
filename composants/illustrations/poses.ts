/*
 * Les positions du corps, écrites en aussi peu de nombres que possible.
 *
 * Placer neuf articulations à la main pour quarante-deux dessins, c'est
 * quatre cents coordonnées à accorder entre elles, et un membre qui s'allonge
 * dès qu'on se trompe d'un pixel — le défaut le plus visible d'une silhouette
 * au trait. On ne donne donc que les extrémités : la hanche et la cheville,
 * l'épaule et la main. Le genou et le coude s'en déduisent, à longueur de
 * segment constante.
 *
 * Le sens de pliure dit de quel côté le membre se casse : un genou plie vers
 * l'arrière, un coude vers l'avant, et c'est la seule chose que la géométrie
 * ne peut pas deviner.
 */

import type { Point, Pose } from "./figure";

/* Longueurs, mesurées sur la silhouette debout et vraies partout ailleurs. */
const FEMUR = 32;
const TIBIA = 25;
const BRAS = 22;
const AVANT_BRAS = 22;

export type Sens = 1 | -1;

/**
 * L'articulation intermédiaire d'un membre dont on connaît les deux bouts.
 *
 * Deux cercles se coupent en deux points ; `sens` choisit lequel. Quand les
 * extrémités s'écartent plus que le membre ne mesure, on tend simplement le
 * membre au lieu de renvoyer un point imaginaire : un bras tendu à bout
 * portant est une position courante, pas une erreur.
 */
export function pliure(
  a: Point,
  b: Point,
  l1: number,
  l2: number,
  sens: Sens,
): Point {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 0.001;
  const ux = dx / d;
  const uy = dy / d;

  if (d >= l1 + l2) return [a[0] + ux * l1, a[1] + uy * l1];

  const x = (d * d + l1 * l1 - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  return [
    a[0] + ux * x - uy * h * sens,
    a[1] + uy * x + ux * h * sens,
  ];
}

/** Ce qu'il faut donner pour obtenir une pose complète. */
export type Squelette = {
  tete: Point;
  cou: Point;
  epaule: Point;
  bassin: Point;
  main: Point;
  cheville: Point;
  pied: Point;
  coudeSens?: Sens;
  genouSens?: Sens;
  /* Membres du fond : mêmes règles, mêmes longueurs, autre extrémité. */
  mainLoin?: Point;
  chevilleLoin?: Point;
  piedLoin?: Point;
};

export function poser(s: Squelette): Pose {
  const coudeSens = s.coudeSens ?? 1;
  const genouSens = s.genouSens ?? -1;

  const loin: Pose["loin"] = {};
  if (s.mainLoin) {
    loin.main = s.mainLoin;
    loin.coude = pliure(s.epaule, s.mainLoin, BRAS, AVANT_BRAS, coudeSens);
  }
  if (s.chevilleLoin) {
    loin.cheville = s.chevilleLoin;
    loin.genou = pliure(s.bassin, s.chevilleLoin, FEMUR, TIBIA, genouSens);
    loin.pied = s.piedLoin;
  }

  return {
    tete: s.tete,
    cou: s.cou,
    epaule: s.epaule,
    coude: pliure(s.epaule, s.main, BRAS, AVANT_BRAS, coudeSens),
    main: s.main,
    bassin: s.bassin,
    genou: pliure(s.bassin, s.cheville, FEMUR, TIBIA, genouSens),
    cheville: s.cheville,
    pied: s.pied,
    loin: loin.main || loin.cheville ? loin : undefined,
  };
}

/* --- Les positions de base --------------------------------------------- */

/** Debout, de profil, regardant vers la droite. */
export function debout(
  x: number,
  main: Point = [x + 8, 84],
  coudeSens: Sens = 1,
): Pose {
  return poser({
    tete: [x + 4, 22],
    cou: [x + 1, 35],
    epaule: [x, 40],
    bassin: [x - 2, 70],
    main,
    cheville: [x - 1, 125],
    pied: [x + 11, 131],
    chevilleLoin: [x - 8, 126],
    piedLoin: [x + 2, 132],
    coudeSens,
    genouSens: -1,
  });
}

/** Debout, buste penché en avant : rowing, soulevé roumain, oiseau. */
export function penche(
  x: number,
  main: Point,
  coudeSens: Sens = 1,
  mainLoin?: Point,
): Pose {
  return poser({
    tete: [x + 29, 48],
    cou: [x + 15, 56],
    epaule: [x + 11, 59],
    bassin: [x - 16, 72],
    main,
    mainLoin,
    cheville: [x - 12, 125],
    pied: [x - 2, 131],
    chevilleLoin: [x - 19, 126],
    piedLoin: [x - 9, 132],
    coudeSens,
    genouSens: -1,
  });
}

/** Accroupi, cuisses au moins parallèles au sol. */
export function accroupi(
  x: number,
  main: Point,
  coudeSens: Sens = 1,
  mainLoin?: Point,
): Pose {
  return poser({
    tete: [x + 10, 52],
    cou: [x + 5, 64],
    epaule: [x + 3, 68],
    bassin: [x - 14, 98],
    main,
    mainLoin,
    cheville: [x - 2, 125],
    pied: [x + 12, 131],
    chevilleLoin: [x - 11, 126],
    piedLoin: [x + 3, 132],
    coudeSens,
    genouSens: -1,
  });
}

/**
 * Allongé sur le dos, sur un banc ou au sol. Tête à droite, pieds à gauche.
 *
 * Le banc étant plus haut que la jambe repliée n'est longue, le genou remonte
 * au lieu de descendre : c'est ce qui se passe réellement quand on garde les
 * pieds au sol sur un banc de développé.
 */
export function allonge(
  x: number,
  ySurface: number,
  main: Point,
  mainLoin?: Point,
): Pose {
  return poser({
    tete: [x + 58, ySurface - 9],
    cou: [x + 44, ySurface - 4],
    epaule: [x + 40, ySurface - 3],
    bassin: [x + 8, ySurface - 1],
    main,
    mainLoin,
    cheville: [x - 12, 125],
    pied: [x - 24, 131],
    coudeSens: -1,
    genouSens: 1,
  });
}

/** Assis, jambes vers l'avant : poulie basse, tirage élastique au sol. */
export function assis(x: number, ySiege: number, main: Point): Pose {
  return poser({
    tete: [x + 2, ySiege - 46],
    cou: [x + 1, ySiege - 33],
    epaule: [x + 2, ySiege - 28],
    bassin: [x, ySiege],
    main,
    cheville: [x + 50, 128],
    pied: [x + 61, 125],
    coudeSens: 1,
    genouSens: 1,
  });
}

/**
 * En planche, sur les mains ou sur les coudes.
 *
 * Le corps forme une seule ligne des épaules aux talons — c'est la faute la
 * plus fréquente de l'exercice, autant que le dessin la montre juste. La
 * cheville n'est donc pas posée à la main : on la calcule à la distance exacte
 * du cou, sur le sol, pour que le tronc et la jambe soient tendus quelle que
 * soit la hauteur des épaules.
 */
export function planche(
  x: number,
  yEpaule: number,
  main: Point,
  coudeSens: Sens = -1,
): Pose {
  const cou: Point = [x + 53, yEpaule - 3];
  const corps = 92; // tronc + jambe, tendus
  const dy = 128 - cou[1];
  const dx = Math.sqrt(Math.max(0, corps * corps - dy * dy));
  const cheville: Point = [cou[0] - dx, 128];
  const bassin: Point = [
    cou[0] + ((cheville[0] - cou[0]) * 35) / corps,
    cou[1] + ((cheville[1] - cou[1]) * 35) / corps,
  ];

  return poser({
    tete: [cou[0] + 12, cou[1] - 6],
    cou,
    epaule: [x + 50, yEpaule],
    bassin,
    main,
    cheville,
    pied: [cheville[0] - 9, 131],
    coudeSens,
    genouSens: 1,
  });
}

/**
 * Suspendu à une barre, bras tendus.
 *
 * L'épaule se déduit des mains et non l'inverse : c'est la barre qui est fixe.
 * Les genoux se replient en arrière, sinon les pieds sortent du cadre — et
 * c'est de toute façon ainsi qu'on se suspend.
 */
export function suspendu(x: number, yBarre: number, main?: Point): Pose {
  // La main part en avant de la tête : dans l'axe, le bras la recouvrirait.
  const m: Point = main ?? [x + 13, yBarre + 4];
  const yEpaule = m[1] + 43;
  return poser({
    tete: [x - 1, yEpaule - 17],
    cou: [x, yEpaule - 5],
    epaule: [x, yEpaule],
    bassin: [x - 2, yEpaule + 30],
    main: m,
    cheville: [x - 26, yEpaule + 42],
    pied: [x - 36, yEpaule + 46],
    coudeSens: 1,
    genouSens: -1,
  });
}

/** À quatre pattes : bird-dog, mountain climbers. */
export function quatrePattes(x: number): Pose {
  return poser({
    tete: [x + 60, 82],
    cou: [x + 48, 88],
    epaule: [x + 44, 90],
    bassin: [x + 8, 92],
    main: [x + 46, 130],
    cheville: [x - 2, 128],
    pied: [x - 12, 131],
    coudeSens: -1,
    genouSens: 1,
  });
}

/** En fente : jambe avant fléchie, jambe arrière tendue, buste droit. */
export function fente(x: number, main: Point = [x + 6, 88]): Pose {
  return poser({
    tete: [x + 4, 30],
    cou: [x + 1, 43],
    epaule: [x, 48],
    bassin: [x - 2, 78],
    main,
    cheville: [x + 28, 122],
    pied: [x + 38, 131],
    chevilleLoin: [x - 32, 124],
    piedLoin: [x - 42, 130],
    coudeSens: 1,
    genouSens: -1,
  });
}

/** Le point situé à `d` de `a`, en allant vers `b`. */
export function vers(a: Point, b: Point, d: number): Point {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.hypot(dx, dy) || 1;
  return [a[0] + (dx / n) * d, a[1] + (dy / n) * d];
}

/**
 * De face, bras écartés : les élévations latérales et le face pull ne se
 * lisent pas de profil, où les deux bras se superposent exactement.
 *
 * Les épaules se confondent alors en un seul point au milieu du buste. C'est
 * faux anatomiquement et juste graphiquement : le dessin se lit comme un T,
 * qui est précisément la forme que l'exercice cherche.
 */
export function deFace(x: number, main: Point, mainLoin: Point): Pose {
  return poser({
    tete: [x, 22],
    cou: [x, 35],
    epaule: [x, 44],
    bassin: [x, 74],
    main,
    mainLoin,
    cheville: [x + 9, 126],
    pied: [x + 13, 131],
    chevilleLoin: [x - 9, 126],
    piedLoin: [x - 13, 131],
    coudeSens: 1,
    genouSens: 1,
  });
}
