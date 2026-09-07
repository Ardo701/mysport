import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";
import { menuPreset } from "./lib/menus";
import { ajouterJours } from "./lib/dates";
import {
  FRAICHEUR,
  type Rayon,
  accumuler,
  cleIngredient,
  formaterQuantite,
  rayonDe,
} from "./lib/rayons";

export const maListe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Reconstruit la liste à partir des menus des prochains jours.
 * Les lignes déjà cochées gardent leur état, les ajouts manuels sont conservés,
 * et les ingrédients dont la date est passée disparaissent d'eux-mêmes.
 */
export const regenerer = mutation({
  args: { depuis: v.string(), jours: v.number() },
  handler: async (ctx, { depuis, jours }) => {
    const userId = await utilisateurConnecte(ctx);
    const jusquA = ajouterJours(depuis, jours - 1);

    const menusEnregistres = await ctx.db
      .query("menus")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", depuis).lte("date", jusquA),
      )
      .collect();

    type Cumul = {
      nom: string;
      rayon: Rayon;
      dateBesoin: string;
      quantite: ReturnType<typeof accumuler>;
    };
    const cumuls = new Map<string, Cumul>();

    for (let i = 0; i < jours; i++) {
      const date = ajouterJours(depuis, i);
      const enregistre = menusEnregistres.find((m) => m.date === date);
      const repas = enregistre ? enregistre.repas : menuPreset(date);

      for (const plat of repas) {
        // Le déjeuner est libre : il n'entre pas dans les courses.
        if (plat.type === "dejeuner") continue;
        for (const ingredient of plat.ingredients) {
          const cle = cleIngredient(ingredient.nom);
          if (cle === "") continue;
          const existant = cumuls.get(cle);
          cumuls.set(cle, {
            nom: existant?.nom ?? ingredient.nom,
            rayon: existant?.rayon ?? rayonDe(ingredient.nom),
            dateBesoin:
              existant && existant.dateBesoin < date ? existant.dateBesoin : date,
            quantite: accumuler(existant?.quantite, ingredient.quantite),
          });
        }
      }
    }

    const lignesExistantes = await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const ligne of lignesExistantes) {
      const cumul = cumuls.get(ligne.cle);

      if (ligne.source === "manuel") {
        // Les ajouts manuels achetés disparaissent une fois la journée passée.
        if (ligne.achete && ligne.dateBesoin < depuis) await ctx.db.delete(ligne._id);
        continue;
      }

      if (!cumul) {
        await ctx.db.delete(ligne._id);
        continue;
      }

      const dateAchatConseillee = dateConseillee(cumul.dateBesoin, cumul.rayon, depuis);
      // Une ligne cochée avant la période en cours redevient à acheter.
      const encoreAchete = ligne.achete && ligne.dateBesoin >= depuis;

      await ctx.db.patch(ligne._id, {
        nom: cumul.nom,
        quantite: formaterQuantite(cumul.quantite),
        rayon: cumul.rayon,
        dateBesoin: cumul.dateBesoin,
        dateAchatConseillee,
        achete: encoreAchete,
        dateAchat: encoreAchete ? ligne.dateAchat : undefined,
      });
      cumuls.delete(ligne.cle);
    }

    for (const [cle, cumul] of cumuls) {
      await ctx.db.insert("courses", {
        userId,
        cle,
        nom: cumul.nom,
        quantite: formaterQuantite(cumul.quantite),
        rayon: cumul.rayon,
        dateBesoin: cumul.dateBesoin,
        dateAchatConseillee: dateConseillee(cumul.dateBesoin, cumul.rayon, depuis),
        achete: false,
        source: "menu",
      });
    }
  },
});

function dateConseillee(dateBesoin: string, rayon: Rayon, plancher: string): string {
  const conseillee = ajouterJours(dateBesoin, -FRAICHEUR[rayon]);
  return conseillee < plancher ? plancher : conseillee;
}

export const basculerAchat = mutation({
  args: { id: v.id("courses"), date: v.string() },
  handler: async (ctx, { id, date }) => {
    const userId = await utilisateurConnecte(ctx);
    const ligne = await ctx.db.get(id);
    if (!ligne || ligne.userId !== userId) throw new Error("Ligne introuvable");
    await ctx.db.patch(id, {
      achete: !ligne.achete,
      dateAchat: ligne.achete ? undefined : date,
    });
  },
});

export const ajouterLigne = mutation({
  args: {
    nom: v.string(),
    quantite: v.string(),
    dateBesoin: v.string(),
  },
  handler: async (ctx, { nom, quantite, dateBesoin }) => {
    const userId = await utilisateurConnecte(ctx);
    const rayon = rayonDe(nom);
    const cle = `manuel-${cleIngredient(nom)}-${Date.now()}`;
    return await ctx.db.insert("courses", {
      userId,
      cle,
      nom: nom.trim(),
      quantite: quantite.trim() || "à vue d'œil",
      rayon,
      dateBesoin,
      dateAchatConseillee: dateBesoin,
      achete: false,
      source: "manuel",
    });
  },
});

export const supprimerLigne = mutation({
  args: { id: v.id("courses") },
  handler: async (ctx, { id }) => {
    const userId = await utilisateurConnecte(ctx);
    const ligne = await ctx.db.get(id);
    if (!ligne || ligne.userId !== userId) throw new Error("Ligne introuvable");
    await ctx.db.delete(id);
  },
});

export const decocherTout = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await utilisateurConnecte(ctx);
    const lignes = await ctx.db
      .query("courses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const ligne of lignes) {
      if (ligne.achete) {
        await ctx.db.patch(ligne._id, { achete: false, dateAchat: undefined });
      }
    }
  },
});
