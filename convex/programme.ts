import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { seanceValidator } from "./lib/validateurs";
import { utilisateurConnecte } from "./lib/session";
import { PROGRAMME_DEFAUT } from "./data/programme";
import { lundiDeLaSemaine } from "./lib/dates";

export const programmeActif = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId).eq("actif", true))
      .unique();
  },
});

export const installerProgrammeParDefaut = mutation({
  args: { dateISO: v.string() },
  handler: async (ctx, { dateISO }) => {
    const userId = await utilisateurConnecte(ctx);
    const actifs = await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId).eq("actif", true))
      .collect();
    for (const p of actifs) await ctx.db.patch(p._id, { actif: false });

    return await ctx.db.insert("programmes", {
      userId,
      nom: PROGRAMME_DEFAUT.nom,
      description: PROGRAMME_DEFAUT.description,
      source: "preset",
      joursParSemaine: PROGRAMME_DEFAUT.joursParSemaine,
      seances: PROGRAMME_DEFAUT.seances,
      progression: PROGRAMME_DEFAUT.progression,
      debutISO: lundiDeLaSemaine(dateISO),
      actif: true,
    });
  },
});

/** Utilisée par l'action IA une fois le programme généré. */
export const remplacerParProgrammeIA = internalMutation({
  args: {
    userId: v.id("users"),
    nom: v.string(),
    description: v.string(),
    joursParSemaine: v.number(),
    seances: v.array(seanceValidator),
    progression: v.array(
      v.object({ bloc: v.string(), semaines: v.string(), consigne: v.string() }),
    ),
    debutISO: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, debutISO, ...reste } = args;
    const actifs = await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId).eq("actif", true))
      .collect();
    for (const p of actifs) await ctx.db.patch(p._id, { actif: false });

    const programmeId = await ctx.db.insert("programmes", {
      userId,
      ...reste,
      source: "ia",
      debutISO: lundiDeLaSemaine(debutISO),
      actif: true,
    });

    // Le planning pointe vers d'anciens identifiants de séance : on le remappe
    // sur les nouvelles séances, dans l'ordre, en gardant les jours et les heures.
    const planning = await ctx.db
      .query("plannings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (planning) {
      const creneaux = [...planning.entrainements].sort((a, b) => a.jour - b.jour);
      const remappes = creneaux
        .slice(0, reste.seances.length)
        .map((creneau, i) => ({ ...creneau, seanceId: reste.seances[i].id }));
      // S'il manque des créneaux pour couvrir toutes les séances, on complète.
      const joursLibres = [1, 2, 3, 4, 5, 6, 7].filter(
        (j) => !remappes.some((c) => c.jour === j),
      );
      for (let i = remappes.length; i < reste.seances.length; i++) {
        const jour = joursLibres.shift();
        if (jour === undefined) break;
        remappes.push({ jour, heure: "18:30", seanceId: reste.seances[i].id });
      }
      await ctx.db.patch(planning._id, {
        entrainements: remappes.sort((a, b) => a.jour - b.jour),
      });
    }

    return programmeId;
  },
});

export const revenirAuProgrammeParDefaut = mutation({
  args: { dateISO: v.string() },
  handler: async (ctx, { dateISO }) => {
    const userId = await utilisateurConnecte(ctx);
    const actifs = await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId).eq("actif", true))
      .collect();
    for (const p of actifs) await ctx.db.patch(p._id, { actif: false });

    const ancienPreset = await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("source"), "preset"))
      .first();

    if (ancienPreset) {
      await ctx.db.patch(ancienPreset._id, { actif: true });
      return ancienPreset._id;
    }

    return await ctx.db.insert("programmes", {
      userId,
      nom: PROGRAMME_DEFAUT.nom,
      description: PROGRAMME_DEFAUT.description,
      source: "preset",
      joursParSemaine: PROGRAMME_DEFAUT.joursParSemaine,
      seances: PROGRAMME_DEFAUT.seances,
      progression: PROGRAMME_DEFAUT.progression,
      debutISO: lundiDeLaSemaine(dateISO),
      actif: true,
    });
  },
});
