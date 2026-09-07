"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { REPARTITION_REPAS } from "./lib/nutrition";

const MODELE = process.env.OPENAI_MODEL ?? "gpt-4o";

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé OpenAI manquante. Ajoute OPENAI_API_KEY dans les variables d'environnement Convex.",
    );
  }
  return new OpenAI({ apiKey });
}

/** Extrait le JSON d'une réponse de complétion. */
function lireJSON<T>(contenu: string | null): T {
  if (!contenu) throw new Error("Réponse vide de l'IA");
  try {
    return JSON.parse(contenu) as T;
  } catch {
    const debut = contenu.indexOf("{");
    const fin = contenu.lastIndexOf("}");
    if (debut === -1 || fin === -1) throw new Error("Réponse illisible de l'IA");
    return JSON.parse(contenu.slice(debut, fin + 1)) as T;
  }
}

const SCHEMA_REPAS_ANALYSE = {
  type: "object",
  additionalProperties: false,
  required: ["nom", "aliments", "total", "confiance", "commentaire"],
  properties: {
    nom: { type: "string", description: "Nom court du repas en français" },
    aliments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "aliment",
          "quantiteEstimee",
          "kcal",
          "proteines",
          "glucides",
          "lipides",
        ],
        properties: {
          aliment: { type: "string" },
          quantiteEstimee: { type: "string" },
          kcal: { type: "number" },
          proteines: { type: "number" },
          glucides: { type: "number" },
          lipides: { type: "number" },
        },
      },
    },
    total: {
      type: "object",
      additionalProperties: false,
      required: ["kcal", "proteines", "glucides", "lipides"],
      properties: {
        kcal: { type: "number" },
        proteines: { type: "number" },
        glucides: { type: "number" },
        lipides: { type: "number" },
      },
    },
    confiance: { type: "string", enum: ["haute", "moyenne", "basse"] },
    commentaire: {
      type: "string",
      description:
        "Une à deux phrases en français, tutoiement, sur l'équilibre du repas et l'ajustement du soir.",
    },
  },
} as const;

export type AnalyseRepas = {
  nom: string;
  aliments: {
    aliment: string;
    quantiteEstimee: string;
    kcal: number;
    proteines: number;
    glucides: number;
    lipides: number;
  }[];
  total: {
    kcal: number;
    proteines: number;
    glucides: number;
    lipides: number;
  };
  confiance: string;
  commentaire: string;
};

function consigneAnalyse(contexte: string) {
  return [
    "Tu es un diététicien du sport francophone. Tu estimes la composition nutritionnelle d'un repas.",
    "Décompose le repas en aliments, estime les quantités en grammes ou en unités courantes,",
    "puis donne les calories et les macros de chaque aliment et le total.",
    "Sois réaliste : tiens compte de l'huile de cuisson, des sauces et du pain qui accompagne.",
    "Si tu n'es pas sûr, choisis une estimation moyenne plutôt que de refuser, et baisse le niveau de confiance.",
    "Réponds en français, en tutoyant, sans jargon.",
    contexte,
  ].join(" ");
}

/** Analyse la photo d'un repas déjà envoyée dans le stockage Convex. */
export const analyserPhotoRepas = action({
  args: { photoId: v.id("_storage"), contexte: v.optional(v.string()) },
  handler: async (ctx, { photoId, contexte }): Promise<AnalyseRepas> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Non authentifié");

    const blob = await ctx.storage.get(photoId);
    if (!blob) throw new Error("Photo introuvable");
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
    const type = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";

    const profil = await ctx.runQuery(internal.internes.profilDe, { userId });
    const cible = profil
      ? `L'utilisateur vise ${profil.kcalCible} kcal et ${profil.proteinesCible} g de protéines par jour.`
      : "";

    const reponse = await client().chat.completions.create({
      model: MODELE,
      messages: [
        { role: "system", content: consigneAnalyse(cible) },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: contexte
                ? `Voici la photo de mon repas. Précision : ${contexte}`
                : "Voici la photo de mon repas, estime ce que ça représente.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${type};base64,${base64}`, detail: "high" },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analyse_repas",
          strict: true,
          schema: SCHEMA_REPAS_ANALYSE,
        },
      },
    });

    return lireJSON<AnalyseRepas>(reponse.choices[0]?.message?.content ?? null);
  },
});

/** Analyse un repas décrit à l'écrit, quand la photo n'est pas possible. */
export const analyserTexteRepas = action({
  args: { description: v.string() },
  handler: async (ctx, { description }): Promise<AnalyseRepas> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Non authentifié");
    if (description.trim().length < 3) {
      throw new Error("Décris un peu plus ce que tu as mangé.");
    }

    const profil = await ctx.runQuery(internal.internes.profilDe, { userId });
    const cible = profil
      ? `L'utilisateur vise ${profil.kcalCible} kcal et ${profil.proteinesCible} g de protéines par jour.`
      : "";

    const reponse = await client().chat.completions.create({
      model: MODELE,
      messages: [
        { role: "system", content: consigneAnalyse(cible) },
        {
          role: "user",
          content: `Voici ce que j'ai mangé, décris-le en aliments et estime les macros : ${description}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analyse_repas",
          strict: true,
          schema: SCHEMA_REPAS_ANALYSE,
        },
      },
    });

    return lireJSON<AnalyseRepas>(reponse.choices[0]?.message?.content ?? null);
  },
});

const SCHEMA_MENU = {
  type: "object",
  additionalProperties: false,
  required: ["repas"],
  properties: {
    repas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "type",
          "nom",
          "tempsMin",
          "ingredients",
          "etapes",
          "kcal",
          "proteines",
          "glucides",
          "lipides",
        ],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["petit_dejeuner", "dejeuner", "collation", "diner"],
          },
          nom: { type: "string" },
          tempsMin: { type: "number" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["nom", "quantite"],
              properties: {
                nom: { type: "string" },
                quantite: { type: "string" },
              },
            },
          },
          etapes: { type: "array", items: { type: "string" } },
          kcal: { type: "number" },
          proteines: { type: "number" },
          glucides: { type: "number" },
          lipides: { type: "number" },
        },
      },
    },
  },
} as const;

/** Génère un menu (matin, collation, soir) pour une ou plusieurs journées. */
export const genererMenu = action({
  args: { dates: v.array(v.string()) },
  handler: async (ctx, { dates }): Promise<number> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Non authentifié");
    const profil = await ctx.runQuery(internal.internes.profilDe, { userId });
    if (!profil) throw new Error("Complète ton profil avant de générer un menu.");

    const openai = client();
    const budgetMatin = Math.round(profil.kcalCible * REPARTITION_REPAS.petit_dejeuner);
    const budgetSoir = Math.round(profil.kcalCible * REPARTITION_REPAS.diner);
    const budgetCollation = Math.round(profil.kcalCible * REPARTITION_REPAS.collation);

    for (const date of dates) {
      const reponse = await openai.chat.completions.create({
        model: MODELE,
        messages: [
          {
            role: "system",
            content: [
              "Tu es un diététicien du sport francophone. Tu écris des menus simples, rapides et réalistes.",
              "Contraintes strictes :",
              "- toutes les préparations font 15 minutes maximum, ingrédients de supermarché courants, conserves autorisées ;",
              `- les seuls légumes autorisés sont : ${profil.legumesAimes.join(", ")} ;`,
              profil.contraintes.length
                ? `- contraintes supplémentaires : ${profil.contraintes.join(", ")} ;`
                : "",
              "- objectif : perte de gras abdominal et prise de muscle, donc protéines élevées à chaque repas ;",
              "Renvoie exactement 3 repas : petit_dejeuner, collation, diner.",
              `Budgets indicatifs : petit-déjeuner ${budgetMatin} kcal, collation ${budgetCollation} kcal, dîner ${budgetSoir} kcal.`,
              `Sur la journée, vise ${profil.proteinesCible} g de protéines au total en comptant un déjeuner libre.`,
              "Les identifiants sont en minuscules avec des tirets. Tout est rédigé en français, en tutoyant.",
            ]
              .filter(Boolean)
              .join(" "),
          },
          {
            role: "user",
            content: `Propose le menu du ${date}. Change des plats habituels, reste simple à cuisiner.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "menu_jour", strict: true, schema: SCHEMA_MENU },
        },
      });

      const menu = lireJSON<{ repas: any[] }>(
        reponse.choices[0]?.message?.content ?? null,
      );

      await ctx.runMutation(internal.repas.enregistrerMenuIA, {
        userId,
        date,
        repas: menu.repas.map((r, i) => ({
          id: `${date}-${r.type}-${i}`,
          type: r.type,
          nom: r.nom,
          tempsMin: Math.round(r.tempsMin),
          ingredients: r.ingredients,
          etapes: r.etapes,
          kcal: Math.round(r.kcal),
          proteines: Math.round(r.proteines),
          glucides: Math.round(r.glucides),
          lipides: Math.round(r.lipides),
        })),
      });
    }

    return dates.length;
  },
});

const SCHEMA_PROGRAMME = {
  type: "object",
  additionalProperties: false,
  required: ["nom", "description", "joursParSemaine", "seances", "progression"],
  properties: {
    nom: { type: "string" },
    description: { type: "string" },
    joursParSemaine: { type: "number" },
    seances: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "nom", "focus", "dureeMin", "echauffement", "exercices", "finisher"],
        properties: {
          id: { type: "string" },
          nom: { type: "string" },
          focus: { type: "string" },
          dureeMin: { type: "number" },
          echauffement: { type: "array", items: { type: "string" } },
          finisher: { type: "string" },
          exercices: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "id",
                "nom",
                "groupes",
                "series",
                "reps",
                "reposSec",
                "salle",
                "maison",
                "conseil",
              ],
              properties: {
                id: { type: "string" },
                nom: { type: "string" },
                groupes: { type: "array", items: { type: "string" } },
                series: { type: "number" },
                reps: { type: "string" },
                reposSec: { type: "number" },
                conseil: { type: "string" },
                salle: {
                  type: "object",
                  additionalProperties: false,
                  required: ["nom", "materiel", "execution"],
                  properties: {
                    nom: { type: "string" },
                    materiel: { type: "string" },
                    execution: { type: "string" },
                  },
                },
                maison: {
                  type: "object",
                  additionalProperties: false,
                  required: ["nom", "materiel", "execution"],
                  properties: {
                    nom: { type: "string" },
                    materiel: { type: "string" },
                    execution: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    progression: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["bloc", "semaines", "consigne"],
        properties: {
          bloc: { type: "string" },
          semaines: { type: "string" },
          consigne: { type: "string" },
        },
      },
    },
  },
} as const;

/** Régénère le programme d'entraînement à partir du profil. */
export const genererProgramme = action({
  args: { dateISO: v.string(), precisions: v.optional(v.string()) },
  handler: async (ctx, { dateISO, precisions }): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Non authentifié");
    const profil = await ctx.runQuery(internal.internes.profilDe, { userId });
    if (!profil) throw new Error("Complète ton profil avant de générer un programme.");

    const historique = await ctx.runQuery(internal.internes.seancesRecentes, {
      userId,
    });
    const seancesFaites = historique.filter((s) => s.statut === "terminee").length;

    const reponse = await client().chat.completions.create({
      model: MODELE,
      messages: [
        {
          role: "system",
          content: [
            "Tu es un coach de musculation francophone. Tu construis un programme de 12 semaines.",
            "Règle absolue : CHAQUE exercice doit exister en deux versions, une version salle avec machines ou charges libres,",
            "et une version maison sans machine (poids du corps, élastique, sac à dos chargé, chaise, table).",
            "Les deux versions doivent travailler le même muscle avec une intensité comparable.",
            "Chaque séance contient 4 à 6 exercices, un échauffement en 2 ou 3 lignes et un finisher.",
            "Trois blocs de progression sur 12 semaines. Tout est rédigé en français, en tutoyant, sans jargon inutile.",
            "Les identifiants sont en minuscules avec des tirets, uniques dans tout le programme.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Profil : ${profil.age} ans, ${profil.sexe}, ${profil.tailleCm} cm, ${profil.poidsKg} kg.`,
            `Objectif : ${profil.objectif} — perdre du ventre et des poignées d'amour, prendre du muscle sur les bras, le dos, les abdos et les pectoraux, entretenir les jambes.`,
            `Disponibilité : ${profil.joursParSemaine} séances par semaine, lieu ${profil.lieu}.`,
            `Séances déjà réalisées dans l'app : ${seancesFaites}.`,
            precisions ? `Précisions : ${precisions}` : "",
            `Génère exactement ${profil.joursParSemaine} séances distinctes.`,
          ]
            .filter(Boolean)
            .join(" "),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "programme", strict: true, schema: SCHEMA_PROGRAMME },
      },
    });

    const programme = lireJSON<any>(reponse.choices[0]?.message?.content ?? null);

    await ctx.runMutation(internal.programme.remplacerParProgrammeIA, {
      userId,
      nom: programme.nom,
      description: programme.description,
      joursParSemaine: Math.round(programme.joursParSemaine),
      seances: programme.seances.map((s: any) => ({
        id: s.id,
        nom: s.nom,
        focus: s.focus,
        dureeMin: Math.round(s.dureeMin),
        echauffement: s.echauffement,
        finisher: s.finisher || undefined,
        exercices: s.exercices.map((e: any) => ({
          id: e.id,
          nom: e.nom,
          groupes: e.groupes,
          series: Math.round(e.series),
          reps: e.reps,
          reposSec: Math.round(e.reposSec),
          salle: e.salle,
          maison: e.maison,
          conseil: e.conseil,
        })),
      })),
      progression: programme.progression,
      debutISO: dateISO,
    });

    return programme.nom;
  },
});
