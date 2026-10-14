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

const RATTRAPAGES: { nom: string; executer: (ctx: MutationCtx) => Promise<string> }[] = [];

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
