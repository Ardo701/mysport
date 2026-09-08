import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { utilisateurConnecte } from "./lib/session";
import { jourDeLaSemaine, semaineDuProgramme } from "./lib/dates";
import { doseDe, semaineDe } from "./lib/programme";

/** Séance prévue par le planning pour une date, plus le suivi du jour. */
export const seanceDuJour = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const programme = await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId).eq("actif", true))
      .unique();
    if (!programme) return null;

    const planning = await ctx.db
      .query("plannings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const jour = jourDeLaSemaine(date);
    const creneau = planning?.entrainements.find((e) => e.jour === jour) ?? null;
    const seance = creneau
      ? (programme.seances.find((s) => s.id === creneau.seanceId) ?? null)
      : null;

    const log = await ctx.db
      .query("seancesLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();

    const numeroSemaine = semaineDuProgramme(programme.debutISO, date);

    return {
      seance,
      heure: creneau?.heure ?? null,
      log,
      semaine: numeroSemaine,
      // La prescription de la semaine, que la page applique aux exercices.
      dosage: semaineDe(programme.semaines, numeroSemaine),
      progression: programme.progression,
      nomProgramme: programme.nom,
    };
  },
});

export const demarrerSeance = mutation({
  args: { date: v.string(), seanceId: v.string(), variante: v.string() },
  handler: async (ctx, { date, seanceId, variante }) => {
    const userId = await utilisateurConnecte(ctx);

    const existant = await ctx.db
      .query("seancesLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (existant) return existant._id;

    const programme = await ctx.db
      .query("programmes")
      .withIndex("by_user_actif", (q) => q.eq("userId", userId).eq("actif", true))
      .unique();
    // Deux échecs distincts : aucun programme actif, ou un programme qui ne
    // contient pas cette séance. Les confondre rendait le second illisible.
    if (!programme) throw new Error("Aucun programme actif");
    const seance = programme.seances.find((s) => s.id === seanceId);
    if (!seance) throw new Error("Séance introuvable dans le programme");

    // Le nombre de séries vient de la semaine en cours, pas de l'exercice :
    // c'est ce qui fait qu'une semaine d'accumulation et une semaine de
    // décharge ne créent pas la même séance.
    const semaine = semaineDe(
      programme.semaines,
      semaineDuProgramme(programme.debutISO, date),
    );

    const series = seance.exercices.flatMap((ex) =>
      Array.from({ length: doseDe(ex, semaine).series }, (_, index) => ({
        exerciceId: ex.id,
        exerciceNom: ex.nom,
        variante,
        index,
        reps: undefined,
        poidsKg: undefined,
        fait: false,
      })),
    );

    return await ctx.db.insert("seancesLog", {
      userId,
      date,
      seanceId,
      seanceNom: seance.nom,
      statut: "en_cours",
      series,
    });
  },
});

export const enregistrerSerie = mutation({
  args: {
    logId: v.id("seancesLog"),
    exerciceId: v.string(),
    index: v.number(),
    reps: v.optional(v.number()),
    poidsKg: v.optional(v.number()),
    fait: v.boolean(),
  },
  handler: async (ctx, { logId, exerciceId, index, reps, poidsKg, fait }) => {
    const userId = await utilisateurConnecte(ctx);
    const log = await ctx.db.get(logId);
    if (!log || log.userId !== userId) throw new Error("Séance introuvable");

    const series = log.series.map((s) =>
      s.exerciceId === exerciceId && s.index === index
        ? { ...s, reps, poidsKg, fait }
        : s,
    );
    await ctx.db.patch(logId, { series });
  },
});

export const choisirVariante = mutation({
  args: {
    logId: v.id("seancesLog"),
    exerciceId: v.string(),
    variante: v.string(),
  },
  handler: async (ctx, { logId, exerciceId, variante }) => {
    const userId = await utilisateurConnecte(ctx);
    const log = await ctx.db.get(logId);
    if (!log || log.userId !== userId) throw new Error("Séance introuvable");
    const series = log.series.map((s) =>
      s.exerciceId === exerciceId ? { ...s, variante } : s,
    );
    await ctx.db.patch(logId, { series });
  },
});

export const terminerSeance = mutation({
  args: {
    logId: v.id("seancesLog"),
    dureeMin: v.number(),
    ressenti: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { logId, dureeMin, ressenti, notes }) => {
    const userId = await utilisateurConnecte(ctx);
    const log = await ctx.db.get(logId);
    if (!log || log.userId !== userId) throw new Error("Séance introuvable");
    await ctx.db.patch(logId, {
      statut: "terminee",
      dureeMin,
      ressenti,
      notes,
    });
  },
});

export const sauterSeance = mutation({
  args: { date: v.string(), seanceId: v.string(), seanceNom: v.string() },
  handler: async (ctx, { date, seanceId, seanceNom }) => {
    const userId = await utilisateurConnecte(ctx);
    const existant = await ctx.db
      .query("seancesLog")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
      .unique();
    if (existant) {
      await ctx.db.patch(existant._id, { statut: "sautee" });
      return existant._id;
    }
    return await ctx.db.insert("seancesLog", {
      userId,
      date,
      seanceId,
      seanceNom,
      statut: "sautee",
      series: [],
    });
  },
});

/** Historique récent, pour la page progression et les charges précédentes. */
export const historique = query({
  args: { limite: v.optional(v.number()) },
  handler: async (ctx, { limite }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db
      .query("seancesLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limite ?? 40);
  },
});

/** Dernières charges utilisées par exercice, pour se repérer d'une séance à l'autre. */
export const dernieresCharges = query({
  args: { seanceId: v.string(), date: v.string() },
  handler: async (ctx, { seanceId, date }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return {};
    const logs = await ctx.db
      .query("seancesLog")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);

    const resultat: Record<string, { reps?: number; poidsKg?: number }> = {};
    for (const log of logs) {
      if (log.seanceId !== seanceId || log.date >= date) continue;
      for (const s of log.series) {
        if (!s.fait) continue;
        if (resultat[s.exerciceId] === undefined) {
          resultat[s.exerciceId] = { reps: s.reps, poidsKg: s.poidsKg };
        }
      }
    }
    return resultat;
  },
});
