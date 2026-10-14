/**
 * Rattrapages ponctuels sur les données déjà enregistrées.
 *
 * Une valeur par défaut ne vaut que pour un compte qui n'a rien enregistré :
 * l'inscription recopie les constantes en base, et la ligne ne bouge plus
 * ensuite. Changer une constante ne rattrape donc rien pour les comptes
 * existants — d'où ce module.
 *
 * `scripts/deployer.mjs` appelle `appliquer` après chaque déploiement. Chaque
 * rattrapage laisse son nom dans la table `migrations` et ne repasse jamais :
 * sans ce garde-fou, quelqu'un qui remettrait volontairement une ancienne
 * valeur se la verrait réécrire au déploiement suivant.
 *
 * Pour en ajouter un : une entrée de plus dans `RATTRAPAGES`, avec un nom qui
 * ne change plus jamais. Le script de déploiement n'a pas à être touché.
 */

import { internalMutation, type MutationCtx } from "./_generated/server";
import { PROGRAMME_DEFAUT } from "./data/programme";

/** Ancienne journée par défaut : coucher tardif et lever à sept heures. */
const ANCIEN = { coucher: "23:00", lever: "07:00", petitDejeuner: "07:30" };
const NOUVEAU = { coucher: "00:00", lever: "08:00", petitDejeuner: "08:30" };

const RATTRAPAGES: { nom: string; executer: (ctx: MutationCtx) => Promise<string> }[] = [
  {
    nom: "journee-minuit-huit-heures",
    async executer(ctx) {
      let touches = 0;
      for (const planning of await ctx.db.query("plannings").collect()) {
        // Seuls les plannings restés exactement sur l'ancien défaut sont
        // corrigés : des heures choisies à la main ne sont pas des heures à
        // rattraper.
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
          // journée type se trie à partir de l'heure de lever, et un repas
          // placé plus tôt s'afficherait après le coucher.
          repas: planning.repas.map((r) =>
            r.type === "petit_dejeuner" && r.heure === ANCIEN.petitDejeuner
              ? { ...r, heure: NOUVEAU.petitDejeuner }
              : r,
          ),
        });
        touches += 1;
      }
      return `${touches} planning(s)`;
    },
  },
  {
    nom: "programme-douze-semaines-ecrites",
    async executer(ctx) {
      let touches = 0;
      for (const programme of await ctx.db.query("programmes").collect()) {
        // Uniquement les programmes préréglés : leurs séances sont une copie
        // de `PROGRAMME_DEFAUT`, pas du contenu de l'utilisateur. Un programme
        // généré par l'IA est le sien, on n'y touche pas — sans couche
        // hebdomadaire, il retombe sur les prescriptions de ses exercices.
        if (programme.source !== "preset") continue;

        // `debutISO` et `actif` ne bougent pas : la date de démarrage
        // détermine la semaine en cours, la réécrire ramènerait le cycle à la
        // semaine 1 et effacerait les semaines déjà faites.
        await ctx.db.patch(programme._id, {
          nom: PROGRAMME_DEFAUT.nom,
          description: PROGRAMME_DEFAUT.description,
          joursParSemaine: PROGRAMME_DEFAUT.joursParSemaine,
          seances: PROGRAMME_DEFAUT.seances,
          semaines: PROGRAMME_DEFAUT.semaines,
          progression: PROGRAMME_DEFAUT.progression,
        });
        touches += 1;
      }
      return `${touches} programme(s)`;
    },
  },
  {
    // L'application se réduit au journal des séances : repas, menus, courses,
    // programme, planning, sommeil, pas et pesées disparaissent. Ce ne sont
    // que des données d'essai, et le nouveau schéma ne les accepterait pas :
    // les tables sont vidées avant qu'il soit déployé. Le profil part aussi,
    // l'accueil en recrée un plus court. Les tables de connexion restent, le
    // compte existant doit pouvoir se reconnecter.
    nom: "vider-donnees-avant-refonte",
    async executer(ctx) {
      const tables = [
        "profils",
        "plannings",
        "programmes",
        "seancesLog",
        "menus",
        "repasLog",
        "sommeilLog",
        "pasLog",
        "courses",
        "mesures",
      ] as const;

      const resume: string[] = [];
      for (const table of tables) {
        const lignes = await ctx.db.query(table).collect();
        for (const ligne of lignes) await ctx.db.delete(ligne._id);
        resume.push(`${table} ${lignes.length}`);
      }

      // Les photos de repas vivent dans le stockage de fichiers, pas dans une
      // table : supprimer les lignes ne les supprime pas.
      const fichiers = await ctx.db.system.query("_storage").collect();
      for (const fichier of fichiers) await ctx.storage.delete(fichier._id);
      resume.push(`fichiers ${fichiers.length}`);

      return resume.join(", ");
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
