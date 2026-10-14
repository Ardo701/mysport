/**
 * Rattrapages ponctuels sur les données déjà enregistrées.
 *
 * Une valeur par défaut ne vaut que pour une ligne écrite après coup : changer
 * une constante ne rattrape rien de ce qui est déjà en base — d'où ce module.
 *
 * `scripts/deployer.mjs` appelle `appliquer` après chaque déploiement. Chaque
 * rattrapage laisse son nom dans la table `migrations` et ne repasse jamais :
 * sans ce garde-fou, quelqu'un qui remettrait volontairement une ancienne
 * valeur se la verrait réécrire au déploiement suivant.
 *
 * Pour en ajouter un : une entrée de plus dans `RATTRAPAGES`, avec un nom qui
 * ne change plus jamais. Le script de déploiement n'a pas à être touché.
 *
 * Les rattrapages déjà passés sont retirés de la liste une fois appliqués en
 * production : ils visaient des tables qui n'existent plus. Leur nom reste
 * dans la table `migrations`, ce qui suffit à ne jamais les rejouer.
 */

import { internalMutation, type MutationCtx } from "./_generated/server";
import { dureeRetenue, estimerKcal } from "./lib/calories";

const RATTRAPAGES: { nom: string; executer: (ctx: MutationCtx) => Promise<string> }[] = [
  {
    // Les premières séances ont été estimées en répartissant la durée entre
    // les exercices au prorata des séries, sans les répétitions ni la charge.
    // Elles sont recalculées avec le modèle travail + récupération, pour que
    // les statistiques ne mélangent pas deux formules. Ces séances ne
    // gardaient pas leur poids : celui du profil, saisi le même jour, le
    // remplace sans erreur notable.
    nom: "kcal-travail-et-recuperation",
    async executer(ctx) {
      let touchees = 0;
      for (const seance of await ctx.db.query("seances").collect()) {
        const profil = await ctx.db
          .query("profils")
          .withIndex("by_user", (q) => q.eq("userId", seance.userId))
          .unique();
        const poidsKg = seance.poidsKg ?? profil?.poidsKg;
        if (!poidsKg) continue;
        const dureeMin = dureeRetenue(seance.dureeMin, seance.exercices);
        await ctx.db.patch(seance._id, {
          dureeMin,
          poidsKg,
          kcal: estimerKcal({ dureeMin, exercices: seance.exercices }, poidsKg),
        });
        touchees += 1;
      }
      return `${touchees} séance(s)`;
    },
  },
];

export const appliquer = internalMutation({
  args: {},
  handler: async (ctx) => {
    const lignes: string[] = [];

    for (const rattrapage of RATTRAPAGES) {
      const deja = await ctx.db
        .query("migrations")
        .withIndex("by_nom", (q) => q.eq("nom", rattrapage.nom))
        .unique();
      if (deja) continue;

      const resume = await rattrapage.executer(ctx);
      await ctx.db.insert("migrations", {
        nom: rattrapage.nom,
        appliqueeLe: Date.now(),
      });
      lignes.push(`${rattrapage.nom} : ${resume}`);
    }

    return lignes.length > 0 ? lignes.join(" ; ") : "aucun rattrapage en attente";
  },
});
