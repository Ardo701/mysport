"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Anneau, BarreMacro, Jauge, Stat } from "@/composants/jauges";
import { Bouton, Carte, Chargement, Etiquette, TitreSection } from "@/composants/ui";
import {
  IconeAssiette,
  IconeCourbe,
  IconeEclair,
  IconeFleche,
  IconeHaltere,
  IconeLune,
  IconePanier,
} from "@/composants/icones";
import { aujourdhuiISO, libelleDate, minutesEnHeures } from "@/lib/dates";
import { libelleTypeRepas } from "@/lib/repas";

function salutation() {
  const h = new Date().getHours();
  if (h < 11) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function PageAujourdhui() {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => setDate(aujourdhuiISO()), []);

  const profil = useQuery(api.profils.monProfil);
  const journal = useQuery(api.repas.journalDuJour, date ? { date } : "skip");
  const menu = useQuery(api.repas.menuDuJour, date ? { date } : "skip");
  const seance = useQuery(api.seances.seanceDuJour, date ? { date } : "skip");
  const nuit = useQuery(api.sommeil.nuitDuJour, date ? { date } : "skip");
  const planning = useQuery(api.planning.monPlanning);
  const mesures = useQuery(api.mesures.historiqueMesures, { limite: 90 });
  const courses = useQuery(api.courses.maListe);

  if (!date || !profil || journal === undefined) return <Chargement />;

  const totaux = (journal ?? []).reduce(
    (acc, r) => ({
      kcal: acc.kcal + r.kcal,
      proteines: acc.proteines + r.proteines,
      glucides: acc.glucides + r.glucides,
      lipides: acc.lipides + r.lipides,
    }),
    { kcal: 0, proteines: 0, glucides: 0, lipides: 0 },
  );

  const typesEnregistres = new Set((journal ?? []).map((r) => r.type));
  const objectifSommeilMin = (planning?.objectifSommeilH ?? 8) * 60;

  const variationPoids =
    mesures && mesures.length >= 2
      ? mesures[mesures.length - 1].poidsKg - mesures[0].poidsKg
      : null;

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="surtitre mb-2.5">{libelleDate(date)}</p>
        <h1 className="titre text-[28px] font-bold leading-none">
          {salutation()}, {profil.prenom}.
        </h1>
      </header>

      {/* Calories et macros */}
      <Carte className="!p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
          <Anneau valeur={totaux.kcal} cible={profil.kcalCible} />
          <div className="w-full flex-1 space-y-3.5">
            <BarreMacro
              libelle="Protéines"
              valeur={totaux.proteines}
              cible={profil.proteinesCible}
            />
            <BarreMacro
              libelle="Glucides"
              valeur={totaux.glucides}
              cible={profil.glucidesCible}
              couleur="var(--color-brume)"
            />
            <BarreMacro
              libelle="Lipides"
              valeur={totaux.lipides}
              cible={profil.lipidesCible}
              couleur="var(--color-brume)"
            />
          </div>
        </div>
      </Carte>

      {/* Séance du jour */}
      <section>
        <TitreSection
          surtitre="Entraînement"
          titre="Séance du jour"
          action={
            seance?.semaine ? (
              <Etiquette ton="jaune">Semaine {seance.semaine} / 12</Etiquette>
            ) : null
          }
        />
        {seance?.seance ? (
          <Link href="/seance" className="block">
            <Carte className="transition hover:border-trait-clair">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <IconeHaltere className="h-4 w-4 text-jaune" />
                    <span className="surtitre !text-brume">
                      {seance.heure ?? "Quand tu veux"} · {seance.seance.dureeMin} min
                    </span>
                  </div>
                  <p className="titre text-[19px] font-semibold leading-tight">
                    {seance.seance.nom}
                  </p>
                  <p className="mt-1 truncate text-[13px] text-brume">
                    {seance.seance.focus}
                  </p>
                </div>
                <IconeFleche className="mt-1 h-5 w-5 shrink-0 text-brume-sombre" />
              </div>

              <div className="mt-4 flex items-center gap-3">
                {seance.log?.statut === "terminee" ? (
                  <Etiquette ton="vert">Séance terminée</Etiquette>
                ) : seance.log?.statut === "sautee" ? (
                  <Etiquette ton="rouge">Séance sautée</Etiquette>
                ) : seance.log ? (
                  <>
                    <div className="flex-1">
                      <Jauge
                        pourcent={
                          (seance.log.series.filter((s) => s.fait).length /
                            Math.max(1, seance.log.series.length)) *
                          100
                        }
                      />
                    </div>
                    <span className="chiffres text-[12px] text-brume">
                      {seance.log.series.filter((s) => s.fait).length}/
                      {seance.log.series.length} séries
                    </span>
                  </>
                ) : (
                  <Etiquette>{seance.seance.exercices.length} exercices</Etiquette>
                )}
              </div>
            </Carte>
          </Link>
        ) : (
          <Carte>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="titre text-[17px] font-semibold">Jour de repos</p>
                <p className="mt-1 text-[13px] leading-relaxed text-brume">
                  Marche 20 à 30 minutes si tu peux : ça creuse le déficit sans
                  fatiguer les muscles.
                </p>
              </div>
              <IconeEclair className="h-5 w-5 shrink-0 text-brume-sombre" />
            </div>
          </Carte>
        )}
      </section>

      {/* Repas */}
      <section>
        <TitreSection
          surtitre="Nutrition"
          titre="Repas du jour"
          action={
            <Link
              href="/repas"
              className="text-[13px] text-brume transition hover:text-jaune"
            >
              Tout voir
            </Link>
          }
        />
        <div className="space-y-2">
          {["petit_dejeuner", "dejeuner", "collation", "diner", "extra"].map((type) => {
            const enregistres = (journal ?? []).filter((r) => r.type === type);
            const prevu = menu?.repas.find((r) => r.type === type);
            const heure = planning?.repas.find((r) => r.type === type)?.heure;
            const fait = typesEnregistres.has(type);

            return (
              <Link key={type} href="/repas" className="block">
                <div className="flex items-center gap-3.5 rounded-net border border-trait bg-nuit px-4 py-3.5 transition hover:border-trait-clair">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      fait
                        ? "border-jaune bg-jaune text-noir"
                        : "border-trait text-brume-sombre"
                    }`}
                  >
                    <IconeAssiette className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-[14px] font-medium leading-tight">
                        {libelleTypeRepas(type)}
                      </p>
                      {heure && (
                        <span className="chiffres text-[11px] text-brume-sombre">
                          {heure}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-brume-sombre">
                      {fait
                        ? enregistres.map((r) => r.nom).join(", ")
                        : type === "dejeuner"
                          ? "Photo ou description à envoyer"
                          : type === "extra"
                            ? "Café, soda, grignotage… à ajouter au besoin"
                            : (prevu?.nom ?? "Rien de prévu")}
                    </p>
                  </div>
                  <span className="chiffres shrink-0 text-[13px] text-brume">
                    {fait
                      ? enregistres.reduce((s, r) => s + r.kcal, 0)
                      : prevu
                        ? `~${prevu.kcal}`
                        : "—"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Courses */}
      <Link href="/courses" className="block">
        <div className="flex items-center gap-3.5 rounded-net border border-trait bg-nuit px-4 py-3.5 transition hover:border-trait-clair">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-trait text-jaune">
            <IconePanier className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium">Liste de courses</span>
            <span className="mt-0.5 block text-[12px] text-brume-sombre">
              {courses === undefined
                ? "Chargement…"
                : courses.filter((l) => !l.achete).length === 0
                  ? "Rien à acheter pour le moment"
                  : `${courses.filter((l) => !l.achete).length} produits à prendre`}
            </span>
          </span>
          <IconeFleche className="h-4 w-4 shrink-0 text-brume-sombre" />
        </div>
      </Link>

      {/* Sommeil */}
      <section>
        <TitreSection surtitre="Récupération" titre="Nuit dernière" />
        <Link href="/sommeil" className="block">
          <Carte className="transition hover:border-trait-clair">
            {nuit ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="chiffres titre text-[26px] font-semibold leading-none">
                      {minutesEnHeures(nuit.dureeMin)}
                    </p>
                    <p className="chiffres mt-2 text-[12px] text-brume-sombre">
                      {nuit.heureCoucher} → {nuit.heureLever} · qualité{" "}
                      {nuit.qualite}/5
                    </p>
                  </div>
                  <IconeLune className="h-5 w-5 text-jaune" />
                </div>
                <div className="mt-4">
                  <Jauge pourcent={(nuit.dureeMin / objectifSommeilMin) * 100} />
                  <p className="mt-2 text-[11px] text-brume-sombre">
                    Objectif {planning?.objectifSommeilH ?? 8} h par nuit
                    {nuit.dureeMin < objectifSommeilMin - 30
                      ? " — tu es en dessous, la récupération musculaire en pâtit."
                      : " — atteint."}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="titre text-[16px] font-semibold">
                    Nuit non enregistrée
                  </p>
                  <p className="mt-1 text-[13px] text-brume">
                    Deux champs à remplir, dix secondes.
                  </p>
                </div>
                <Bouton taille="petite">Noter</Bouton>
              </div>
            )}
          </Carte>
        </Link>
      </section>

      <section>
        <div className="grid grid-cols-2 gap-2">
          <Stat
            libelle="Poids actuel"
            valeur={mesures?.at(-1)?.poidsKg ?? profil.poidsKg}
            unite="kg"
            detail={
              variationPoids === null
                ? "Ajoute une pesée"
                : variationPoids === 0
                  ? "Stable depuis le début"
                  : `${variationPoids > 0 ? "+" : ""}${variationPoids.toFixed(1)} kg depuis le début`
            }
          />
          <Link href="/progression" className="block">
            <div className="flex h-full items-center justify-between rounded-net border border-trait bg-ardoise px-3.5 py-3 transition hover:border-trait-clair">
              <div>
                <p className="surtitre mb-2">Suivi</p>
                <p className="titre text-[15px] font-semibold leading-none">
                  Progression
                </p>
              </div>
              <IconeCourbe className="h-5 w-5 text-jaune" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
