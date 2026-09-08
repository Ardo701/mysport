/**
 * Rattrapages ponctuels sur les données déjà enregistrées.
 *
 * Une valeur par défaut ne vaut que pour un compte qui n'a rien enregistré :
 * `creerPlanningParDefaut` recopie la constante en base à l'inscription, et la
 * ligne ne bouge plus ensuite. Changer la constante ne rattrape donc rien pour
 * les comptes existants — d'où ce module.
 *
 * `scripts/deployer.mjs` appelle `appliquer` après chaque déploiement. Chaque
 * rattrapage laisse sa trace dans la table `migrations` et ne repasse jamais :
 * sans ce garde-fou, quelqu'un qui remettrait volontairement les anciennes
 * heures se les verrait réécrire au déploiement suivant.
 */

import { internalMutation } from "./_generated/server";

const NOM = "journee-minuit-huit-heures";

/** Ancienne journée par défaut, celle que ce rattrapage remplace. */
const ANCIEN = { coucher: "23:00", lever: "07:00", petitDejeuner: "07:30" };
const NOUVEAU = { coucher: "00:00", lever: "08:00", petitDejeuner: "08:30" };

export const appliquer = internalMutation({
  args: {},
  handler: async (ctx) => {
    const deja = await ctx.db
      .query("migrations")
      .withIndex("by_nom", (q) => q.eq("nom", NOM))
      .unique();
    if (deja) return `${NOM} : déjà appliqué, rien à faire.`;

    let touches = 0;
    for (const planning of await ctx.db.query("plannings").collect()) {
      // Seuls les plannings restés sur l'ancien défaut sont corrigés : des
      // heures choisies à la main ne sont pas des heures à rattraper.
      if (
        planning.heureCoucher !== ANCIEN.coucher ||
        planning.heureLever !== ANCIEN.lever
      ) {
        continue;
      }

      await ctx.db.patch(planning._id, {
        heureCoucher: NOUVEAU.coucher,
        heureLever: NOUVEAU.lever,
        // Le petit-déjeuner suit le lever, sinon il tomberait avant : la
        // journée type se trie à partir de l'heure de lever, et un repas placé
        // plus tôt se retrouverait affiché après le coucher.
        repas: planning.repas.map((r) =>
          r.type === "petit_dejeuner" && r.heure === ANCIEN.petitDejeuner
            ? { ...r, heure: NOUVEAU.petitDejeuner }
            : r,
        ),
      });
      touches += 1;
    }

    await ctx.db.insert("migrations", { nom: NOM, appliqueeLe: Date.now() });
    return `${NOM} : ${touches} planning(s) mis à jour.`;
  },
});
