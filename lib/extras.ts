/**
 * Ajouts rapides : ce qui se grignote ou se boit entre les repas.
 * Valeurs pour une portion courante, à ajouter en un geste.
 */

export type Extra = {
  id: string;
  nom: string;
  portion: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
};

export const BOISSONS: Extra[] = [
  { id: "cafe-lait", nom: "Café au lait", portion: "1 tasse", kcal: 60, proteines: 3, glucides: 5, lipides: 3 },
  { id: "cafe-noir", nom: "Café ou thé nature", portion: "1 tasse", kcal: 2, proteines: 0, glucides: 0, lipides: 0 },
  { id: "soda", nom: "Soda sucré", portion: "33 cl", kcal: 139, proteines: 0, glucides: 35, lipides: 0 },
  { id: "soda-zero", nom: "Soda zéro", portion: "33 cl", kcal: 1, proteines: 0, glucides: 0, lipides: 0 },
  { id: "jus-orange", nom: "Jus de fruit", portion: "25 cl", kcal: 112, proteines: 2, glucides: 26, lipides: 0 },
  { id: "biere", nom: "Bière", portion: "33 cl", kcal: 142, proteines: 1, glucides: 11, lipides: 0 },
  { id: "verre-vin", nom: "Verre de vin", portion: "12 cl", kcal: 100, proteines: 0, glucides: 3, lipides: 0 },
  { id: "energisante", nom: "Boisson énergisante", portion: "25 cl", kcal: 112, proteines: 0, glucides: 28, lipides: 0 },
  { id: "lait", nom: "Lait demi-écrémé", portion: "25 cl", kcal: 116, proteines: 8, glucides: 12, lipides: 4 },
  { id: "shaker", nom: "Shaker de whey", portion: "1 dose", kcal: 120, proteines: 24, glucides: 3, lipides: 2 },
];

export const GRIGNOTAGES: Extra[] = [
  { id: "carre-chocolat", nom: "Carré de chocolat", portion: "1 carré", kcal: 55, proteines: 1, glucides: 5, lipides: 3 },
  { id: "barre-choco", nom: "Barre chocolatée", portion: "1 barre", kcal: 230, proteines: 3, glucides: 30, lipides: 11 },
  { id: "chips", nom: "Poignée de chips", portion: "30 g", kcal: 160, proteines: 2, glucides: 15, lipides: 10 },
  { id: "biscuits", nom: "Biscuits", portion: "3 biscuits", kcal: 150, proteines: 2, glucides: 21, lipides: 6 },
  { id: "pain-fromage", nom: "Pain et fromage", portion: "1 part", kcal: 220, proteines: 10, glucides: 18, lipides: 12 },
  { id: "amandes", nom: "Poignée d'amandes", portion: "25 g", kcal: 150, proteines: 5, glucides: 5, lipides: 13 },
  { id: "fruit", nom: "Un fruit", portion: "1 pièce", kcal: 85, proteines: 1, glucides: 20, lipides: 0 },
  { id: "yaourt", nom: "Yaourt nature", portion: "1 pot", kcal: 75, proteines: 6, glucides: 8, lipides: 2 },
  { id: "viennoiserie", nom: "Viennoiserie", portion: "1 pièce", kcal: 300, proteines: 6, glucides: 32, lipides: 16 },
  { id: "kebab-frites", nom: "Frites", portion: "1 portion moyenne", kcal: 350, proteines: 4, glucides: 45, lipides: 17 },
  { id: "glace", nom: "Glace", portion: "2 boules", kcal: 200, proteines: 3, glucides: 24, lipides: 10 },
  { id: "bonbons", nom: "Bonbons", portion: "1 poignée", kcal: 120, proteines: 0, glucides: 29, lipides: 0 },
];
