"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { dureeEstimeeMin } from "@/convex/lib/programme";
import { BarreMacro, Compteur, Jauge, Stat } from "@/composants/jauges";
import {
  Bouton,
  Carte,
  Chargement,
  Colonne,
  Colonnes,
  Etiquette,
  TitreSection,
} from "@/composants/ui";
import {
  IconeAssiette,
  IconeCourbe,
  IconeEclair,
  IconeFleche,
  IconeHaltere,
  IconeLune,
  IconePanier,
} from "@/composants/icones";
import { CartePas } from "@/composants/pas";
import { aujourdhuiISO, libelleDate, minutesEnHeures } from "@/lib/dates";
import { effortDuJour } from "@/lib/effort";
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
  const pas = useQuery(api.pas.pasDuJour, date ? { date } : "skip");

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

  // La durée du jour : celle qu'on a vraiment mise si la séance est finie,
  // sinon celle qu'annonce la prescription de la semaine.
  const dureePrevue = seance?.seance
    ? dureeEstimeeMin(seance.seance, seance.dosage)
    : null;
  const seanceFaite =
    seance?.log?.statut === "terminee"
      ? (seance.log.dureeMin ?? dureePrevue)
      : null;
  const effort = effortDuJour(profil, pas?.pas ?? null, seanceFaite);

  const typesEnregistres = new Set((journal ?? []).map((r) => r.type));
  const objectifSommeilMin = (planning?.objectifSommeilH ?? 8) * 60;

  const variationPoids =
    mesures && mesures.length >= 2
      ? mesures[mesures.length - 1].poidsKg - mesures[0].poidsKg
      : null;

  return (
    <div className="space-y-8">
      <header className="mb-10 pt-1 lg:mb-12 lg:pt-0">
        <p className="surtitre mb-2.5">{libelleDate(date)}</p>
        <h1 className="titre text-[30px] font-bold leading-[0.95] tracking-[-0.03em] lg:text-[38px]">
          {salutation()}, {profil.prenom}.
        </h1>
      </header>

      {/* Le corps à gauche, l'assiette à droite : deux colonnes qui se
          rangent l'une sous l'autre dès que l'écran rétrécit. */}
      <Colonnes>
        <Colonne>
          {/* Calories et macros */}
          <section>
            <TitreSection titre="Énergie" />
            <Compteur valeur={totaux.kcal} cible={effort.kcalCible} />
            <div className="mt-6 space-y-2.5">
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
          </section>

          {/* Séance du jour */}
          <section>
            <TitreSection
              titre="Séance du jour"
              action={
                seance?.semaine ? (
                  <Etiquette ton="jaune">Semaine {seance.semaine} / 12</Etiquette>
                ) : null
              }
            />
            {seance?.seance ? (
              <Link href="/seance" className="block">
                <Carte className="border-t border-trait px-1 py-3.5 transition-colors hover:border-trait-vif">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-2">
                        <IconeHaltere className="h-4 w-4 text-jaune" />
                        <span className="surtitre !text-brume">
                          {seance.heure ?? "Quand tu veux"} · environ {dureePrevue} min
                        </span>
                      </div>
                      <p className="titre text-[19px] font-semibold leading-tight">
                        {seance.seance.nom}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-brume">
                        {seance.seance.focus}
                      </p>
                    </div>
                    <IconeFleche className="mt-1 h-5 w-5 shrink-0 text-brume-faible" />
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
                  <IconeEclair className="h-5 w-5 shrink-0 text-brume-faible" />
                </div>
              </Carte>
            )}
          </section>
        </Colonne>

        <Colonne>
          {/* Repas */}
          <section>
            <TitreSection
              titre="Repas du jour"
              action={
                <Link
                  href="/repas"
                  className="text-[13px] text-brume transition-colors hover:text-jaune"
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
                    <div className="flex items-center gap-3.5 border-t border-trait px-4 py-3.5 transition-colors hover:border-trait-vif">
                      {/* Repas pris ou non : un carré plein suffit, l'icône
                          d'assiette se répétait sur chaque ligne sans rien
                          distinguer. */}
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 ${
                          fait ? "bg-jaune-vif" : "border border-trait-vif"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-[14px] font-medium leading-tight">
                            {libelleTypeRepas(type)}
                          </p>
                          {heure && (
                            <span className="chiffres text-[11px] text-brume-faible">
                              {heure}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-brume-faible">
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
        </Colonne>
      </Colonnes>

      <Colonnes>
        <Colonne>
          {/* Pas et effort */}
          <CartePas date={date} profil={profil} seanceDureeMin={seanceFaite} />

          {/* Courses */}
          <Link href="/courses" className="block">
            <div className="flex items-center gap-3.5 border-t border-trait px-4 py-3.5 transition-colors hover:border-trait-vif">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium">Liste de courses</span>
                <span className="mt-0.5 block text-[12px] text-brume-faible">
                  {courses === undefined
                    ? "Chargement…"
                    : courses.filter((l) => !l.achete).length === 0
                      ? "Rien à acheter pour le moment"
                      : `${courses.filter((l) => !l.achete).length} produits à prendre`}
                </span>
              </span>
              <IconeFleche className="h-4 w-4 shrink-0 text-brume-faible" />
            </div>
          </Link>
        </Colonne>

        <Colonne>
          {/* Sommeil */}
          <section>
            <TitreSection titre="Nuit dernière" />
            <Link href="/sommeil" className="block">
              <Carte className="border-t border-trait px-1 py-3.5 transition-colors hover:border-trait-vif">
                {nuit ? (
                  <>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="chiffres titre text-[26px] font-semibold leading-none">
                          {minutesEnHeures(nuit.dureeMin)}
                        </p>
                        <p className="chiffres mt-2 text-[12px] text-brume-faible">
                          {nuit.heureCoucher} → {nuit.heureLever} · qualité{" "}
                          {nuit.qualite}/5
                        </p>
                      </div>
                      <IconeLune className="h-5 w-5 text-jaune" />
                    </div>
                    <div className="mt-4">
                      <Jauge pourcent={(nuit.dureeMin / objectifSommeilMin) * 100} />
                      <p className="mt-2 text-[11px] text-brume-faible">
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
                <div className="flex h-full items-center justify-between border-t border-trait px-3.5 py-3 transition-colors hover:border-trait-vif">
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
        </Colonne>
      </Colonnes>
    </div>
  );
}
