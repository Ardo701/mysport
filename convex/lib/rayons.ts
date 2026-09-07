/**
 * Classement des ingrédients par rayon et regroupement des quantités,
 * pour construire une liste de courses lisible à partir des menus.
 */

export const RAYONS = [
  "Fruits et légumes",
  "Boucherie et poissonnerie",
  "Crèmerie",
  "Épicerie",
  "Boissons",
  "Autres",
] as const;

export type Rayon = (typeof RAYONS)[number];

/** Nombre de jours avant le besoin où l'achat reste raisonnable. */
export const FRAICHEUR: Record<Rayon, number> = {
  "Fruits et légumes": 3,
  "Boucherie et poissonnerie": 2,
  Crèmerie: 5,
  Épicerie: 10,
  Boissons: 10,
  Autres: 5,
};

/**
 * Cas particuliers, testés avant tout le reste : ces mots l'emportent sur
 * l'ingrédient lui-même (« beurre de cacahuète » n'est pas de la crèmerie,
 * « carottes en conserve » ne se périme pas comme des carottes fraîches).
 */
const EXCEPTIONS: [Rayon, string[]][] = [
  ["Épicerie", ["conserve", "surgel", "cacahuete", "coco", "seche", "en boite"]],
];

const MOTS_CLES: [Rayon, string[]][] = [
  [
    "Boucherie et poissonnerie",
    [
      "poulet",
      "dinde",
      "escalope",
      "steak",
      "boeuf",
      "bœuf",
      "jambon",
      "saumon",
      "poisson",
      "viande",
      "haché",
    ],
  ],
  [
    "Crèmerie",
    [
      "oeuf",
      "œuf",
      "fromage",
      "skyr",
      "lait",
      "yaourt",
      "beurre",
      "crème",
      "creme",
    ],
  ],
  [
    "Fruits et légumes",
    [
      "salade",
      "carotte",
      "courgette",
      "chou",
      "brocoli",
      "tomate",
      "concombre",
      "pomme de terre",
      "petits pois",
      "haricot",
      "poivron",
      "épinard",
      "epinard",
      "banane",
      "pomme",
      "fruit",
      "citron",
      "oignon",
      "légume",
      "legume",
    ],
  ],
  [
    "Boissons",
    ["jus", "soda", "eau ", "boisson", "café", "cafe", "thé", "the "],
  ],
  [
    "Épicerie",
    [
      "riz",
      "pâtes",
      "pates",
      "semoule",
      "flocons",
      "avoine",
      "pain",
      "muesli",
      "miel",
      "huile",
      "épice",
      "epice",
      "curry",
      "paprika",
      "conserve",
      "coulis",
      "thon",
      "whey",
      "amande",
      "noix",
      "cacahuète",
      "cacahuete",
      "levure",
      "tortilla",
      "coco",
      "sel",
      "poivre",
      "vinaigrette",
      "chocolat",
      "biscuit",
    ],
  ],
];

/** Minuscules sans accent ni ligature, pour comparer des noms d'ingrédients. */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/\u0153/g, "oe")
    .replace(/\u00e6/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function rayonDe(nomIngredient: string): Rayon {
  const nom = normaliser(nomIngredient);
  for (const [rayon, mots] of [...EXCEPTIONS, ...MOTS_CLES]) {
    for (const mot of mots) {
      const cle = normaliser(mot).trim();
      if (cle && nom.includes(cle)) return rayon;
    }
  }
  return "Autres";
}

/** Clé stable d'un ingrédient, pour retrouver une ligne d'une génération à l'autre. */
export function cleIngredient(nom: string): string {
  return normaliser(nom)
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    // Singulier approximatif : « tomates » et « tomate » sont le même produit.
    .map((mot) => (mot.length > 3 && mot.endsWith("s") ? mot.slice(0, -1) : mot))
    .join("-");
}

type Quantite = { unites: Record<string, number>; libelles: string[] };

const UNITES_CONNUES = [
  "g",
  "kg",
  "ml",
  "cl",
  "l",
  "tranche",
  "tranches",
  "boîte",
  "boîtes",
  "dose",
  "doses",
  "cuillère à café",
  "cuillères à café",
  "cuillère à soupe",
  "cuillères à soupe",
];

/** Ramène les pluriels au singulier, pour cumuler sous une seule clé. */
const SINGULIERS: Record<string, string> = {
  tranches: "tranche",
  "boîtes": "boîte",
  doses: "dose",
  "cuillères à café": "cuillère à café",
  "cuillères à soupe": "cuillère à soupe",
};

/** Découpe « 180 g », « 2 tranches (80 g) », « 1 boîte » en nombre et unité. */
function analyser(quantite: string): { nombre: number; unite: string } | null {
  const nettoye = quantite.trim().toLowerCase().replace(",", ".");
  const correspondance = nettoye.match(
    /^(\d+(?:\.\d+)?)\s*(cuillères? à (?:café|soupe)|[a-zà-ÿ]+)?/,
  );
  if (!correspondance) return null;
  const nombre = Number(correspondance[1]);
  if (!Number.isFinite(nombre)) return null;
  let unite = (correspondance[2] ?? "").trim();
  if (unite && !UNITES_CONNUES.includes(unite)) {
    // « 1 grande », « 2 moyennes », « 3 entiers » : on compte des pièces.
    unite = "";
  }
  return { nombre, unite: SINGULIERS[unite] ?? unite };
}

export function accumuler(cumul: Quantite | undefined, quantite: string): Quantite {
  const courant: Quantite = cumul ?? { unites: {}, libelles: [] };
  const analyse = analyser(quantite);
  if (analyse) {
    const cle = analyse.unite === "" ? "pièce" : analyse.unite;
    courant.unites[cle] = (courant.unites[cle] ?? 0) + analyse.nombre;
  } else {
    courant.libelles.push(quantite);
  }
  return courant;
}

const PLURIELS: Record<string, string> = {
  pièce: "pièces",
  tranche: "tranches",
  boîte: "boîtes",
  dose: "doses",
  "cuillère à café": "cuillères à café",
  "cuillère à soupe": "cuillères à soupe",
};

/** Deux décimales au plus, zéros inutiles retirés, virgule française. */
function nombre(valeur: number): string {
  return (Math.round(valeur * 100) / 100)
    .toString()
    .replace(".", ",");
}

export function formaterQuantite(cumul: Quantite): string {
  const morceaux: string[] = [];
  for (const [unite, total] of Object.entries(cumul.unites)) {
    if (unite === "g" && total >= 1000) {
      morceaux.push(`${nombre(total / 1000)} kg`);
      continue;
    }
    if (unite === "ml" && total >= 1000) {
      morceaux.push(`${nombre(total / 1000)} l`);
      continue;
    }
    const libelle = total > 1 ? (PLURIELS[unite] ?? unite) : unite;
    morceaux.push(`${nombre(total)} ${libelle}`);
  }
  // Les mentions non chiffrées (« au goût ») n'apparaissent qu'une fois.
  morceaux.push(...new Set(cumul.libelles));
  return morceaux.join(" + ") || "à vue d'œil";
}
