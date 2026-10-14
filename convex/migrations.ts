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
import { recalculerSeances } from "./pesees";

const RATTRAPAGES: { nom: string; executer: (ctx: MutationCtx) => Promise<string> }[] = [
  {
    // Le poids était une valeur unique du profil. Il devient une suite de
    // pesées datées : la valeur du profil devient la première, au jour de la
    // création du profil, puis quitte le profil. Les séances sont ensuite
    // réestimées selon la règle des pesées.
    nom: "pesees-depuis-profils",
    async executer(ctx) {
      let profils = 0;
      let seances = 0;
      for (const profil of await ctx.db.query("profils").collect()) {
        if (profil.poidsKg === undefined) continue;
        const dejaPese = await ctx.db
          .query("pesees")
          .withIndex("by_user_date", (q) => q.eq("userId", profil.userId))
          .first();
        if (!dejaPese) {
          await ctx.db.insert("pesees", {
            userId: profil.userId,
            date: new Date(profil._creationTime).toISOString().slice(0, 10),
            poidsKg: profil.poidsKg,
          });
        }
        await ctx.db.patch(profil._id, { poidsKg: undefined });
        seances += await recalculerSeances(ctx, profil.userId);
        profils += 1;
      }
      return `${profils} profil(s), ${seances} séance(s) recalculée(s)`;
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
