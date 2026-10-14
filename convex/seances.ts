import { v, type Infer } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { dureeConnue, dureeRetenue, estimerKcal } from "./lib/calories";
import { utilisateurConnecte } from "./lib/session";
import { exerciceValidator } from "./schema";

/**
 * Toutes les séances, de la plus récente à la plus ancienne.
 *
 * Sans pagination : à quelques séances par semaine, dix ans tiennent en un
 * millier de lignes, et les statistiques ont besoin de tout l'historique.
 */
export const mesSeances = query({
  args: {},
  handler: async (ctx) => {
    const userId = await utilisateurConnecte(ctx);
    return await ctx.db
      .query("seances")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * L'identifiant vient de l'adresse de la page : il peut être tronqué ou
 * périmé. Une chaîne quelconque répond donc « introuvable » plutôt que de
 * faire échouer la requête, ce qui ferait tomber toute la page.
 */
export const seance = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await utilisateurConnecte(ctx);
    const valide = ctx.db.normalizeId("seances", id);
    const ligne = valide ? await ctx.db.get(valide) : null;
    return ligne && ligne.userId === userId ? ligne : null;
  },
});

export const enregistrer = mutation({
  args: {
    id: v.optional(v.id("seances")),
    date: v.string(),
    dureeMin: v.number(),
    exercices: v.array(exerciceValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, date, dureeMin, exercices, notes }) => {
    const userId = await utilisateurConnecte(ctx);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date invalide");

    const propres = exercices.map(nettoyer);
    const saisie = positif(dureeMin) ?? 0;
    if (!dureeConnue(saisie, propres)) throw new Error("Durée manquante");
    const duree = dureeRetenue(saisie, propres);
    if (duree > 24 * 60) throw new Error("Durée hors limites");

    const profil = await profilDe(ctx, userId);
    const ligne = {
      date,
      dureeMin: duree,
      exercices: propres,
      notes: notes?.trim() || undefined,
      kcal: estimerKcal({ dureeMin: duree, exercices: propres }, profil.poidsKg),
      poidsKg: profil.poidsKg,
    };

    if (id) {
      await verifierProprietaire(ctx, userId, id);
      await ctx.db.replace(id, { userId, ...ligne });
      return id;
    }
    return await ctx.db.insert("seances", { userId, ...ligne });
  },
});

export const supprimer = mutation({
  args: { id: v.id("seances") },
  handler: async (ctx, { id }) => {
    const userId = await utilisateurConnecte(ctx);
    await verifierProprietaire(ctx, userId, id);
    await ctx.db.delete(id);
  },
});

async function profilDe(ctx: QueryCtx, userId: Id<"users">) {
  const profil = await ctx.db
    .query("profils")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (!profil) throw new Error("Profil introuvable");
  return profil;
}

async function verifierProprietaire(ctx: QueryCtx, userId: Id<"users">, id: Id<"seances">) {
  const existante = await ctx.db.get(id);
  if (!existante || existante.userId !== userId) throw new Error("Séance introuvable");
}

/** Un champ vide ou nul n'est pas une mesure : il disparaît plutôt que de valoir zéro. */
function positif(n: number | undefined) {
  return n !== undefined && Number.isFinite(n) && n > 0 ? n : undefined;
}

function nettoyer(e: Infer<typeof exerciceValidator>): Infer<typeof exerciceValidator> {
  const nom = e.nom.trim();
  if (!nom) throw new Error("Exercice sans nom");
  const materiel = e.mesure === "duree" ? undefined : e.materiel;
  return {
    exerciceId: e.exerciceId,
    nom,
    mesure: e.mesure,
    series: positif(e.series),
    repetitions: positif(e.repetitions),
    secondes: positif(e.secondes),
    materiel,
    // Au poids du corps, il n'y a rien à peser : une charge restée dans le
    // champ avant qu'on change de matériel ne doit pas s'enregistrer.
    chargeKg: materiel === "poids-du-corps" ? undefined : positif(e.chargeKg),
    dureeMin: positif(e.dureeMin),
    distanceKm: positif(e.distanceKm),
  };
}
