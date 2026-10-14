"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { GrilleStats, Stat } from "@/composants/jauges";
import { IconeChevronDroite, IconeChrono, IconePlus } from "@/composants/icones";
import { useLangue, type Langue } from "@/composants/langue";
import { LigneSeance } from "@/composants/seance";
import {
  BoutonLien,
  Carte,
  Chargement,
  Colonne,
  Colonnes,
  EnTetePage,
  TitreSection,
} from "@/composants/ui";
import {
  ajouterJours,
  aujourdhuiISO,
  joursCourts,
  libelleDate,
  lundiDeLaSemaine,
} from "@/lib/dates";
import { entre, libelleDuree, nombre, totaux } from "@/lib/seances";

function salutation(langue: Langue) {
  const h = new Date().getHours();
  if (langue === "fr") return h < 5 || h >= 18 ? "Bonsoir" : "Bonjour";
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

export default function PageAccueil() {
  // La date vient de l'appareil, pas du serveur : elle n'existe qu'une fois la
  // page chargée dans le navigateur.
  const [aujourdhui, setAujourdhui] = useState<string | null>(null);
  useEffect(() => setAujourdhui(aujourdhuiISO()), []);

  const { langue, t } = useLangue();
  const profil = useQuery(api.profils.monProfil);
  const seances = useQuery(api.seances.mesSeances);

  if (!aujourdhui || !profil || seances === undefined) return <Chargement />;

  const lundi = lundiDeLaSemaine(aujourdhui);
  const semaine = totaux(entre(seances, lundi, ajouterJours(lundi, 6)));
  const joursActifs = new Set(entre(seances, lundi, ajouterJours(lundi, 6)).map((s) => s.date));

  // Trente jours glissants plutôt que le mois civil : le 2 du mois, un mois
  // civil ne contiendrait presque rien et ses moyennes ne voudraient rien dire.
  const recent = totaux(entre(seances, ajouterJours(aujourdhui, -29), aujourdhui));
  const semainesRecentes = 30 / 7;

  return (
    <div>
      <EnTetePage
        surtitre={libelleDate(aujourdhui, langue)}
        titre={`${salutation(langue)}, ${profil.prenom}`}
      />

      <Colonnes>
        <Colonne>
          <Carte>
            <TitreSection titre={t("Cette semaine", "This week")} />
            <div className="boite p-4">
              <div className="grid grid-cols-7 gap-1.5">
                {joursCourts(langue).map((lettre, i) => {
                  const jour = ajouterJours(lundi, i);
                  const actif = joursActifs.has(jour);
                  const estAujourdhui = jour === aujourdhui;
                  return (
                    <div key={jour} className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-medium text-brume">{lettre}</span>
                      <span
                        className={`titre text-[15px] leading-none ${
                          estAujourdhui ? "font-bold text-encre" : "font-medium text-brume"
                        }`}
                      >
                        {Number(jour.slice(8))}
                      </span>
                      <span
                        aria-label={actif ? t("séance", "workout") : undefined}
                        className={`mt-1 h-1.5 w-full rounded-full ${actif ? "bg-accent" : "bg-piste"}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 border-t border-trait pt-3.5">
                {[
                  {
                    libelle:
                      langue === "fr"
                        ? semaine.seances > 1 ? "séances" : "séance"
                        : semaine.seances === 1 ? "workout" : "workouts",
                    valeur: String(semaine.seances),
                  },
                  { libelle: t("de sport", "of exercise"), valeur: libelleDuree(semaine.dureeMin, langue) },
                  { libelle: "kcal", valeur: nombre(semaine.kcal, langue) },
                ].map((s, i) => (
                  <div key={s.libelle} className={i > 0 ? "border-l border-trait pl-3.5" : ""}>
                    <p className="titre text-[22px] font-semibold leading-tight">{s.valeur}</p>
                    <p className="text-[12px] text-brume">{s.libelle}</p>
                  </div>
                ))}
              </div>
            </div>
          </Carte>

          <BoutonLien href="/seance" taille="large">
            <IconePlus className="h-[18px] w-[18px]" />
            {t("Ajouter une séance", "Add a workout")}
          </BoutonLien>

          <Carte>
            <TitreSection
              titre={t("Dernières séances", "Latest workouts")}
              action={
                seances.length > 0 ? (
                  <Link href="/journal" className="transition-colors hover:text-encre">
                    {t("Tout le journal", "Full log")}
                  </Link>
                ) : undefined
              }
            />
            {seances.length === 0 ? (
              <p className="boite px-4 py-4 text-[13px] leading-relaxed text-brume">
                {t(
                  "Rien pour l'instant. Chaque séance notée alimente le journal et les statistiques.",
                  "Nothing yet. Every workout you log feeds the log and the statistics.",
                )}
              </p>
            ) : (
              <div className="boite divide-y divide-trait overflow-hidden">
                {seances.slice(0, 4).map((s) => (
                  <LigneSeance key={s._id} seance={s} />
                ))}
              </div>
            )}
          </Carte>
        </Colonne>

        <Colonne>
          <Carte>
            <TitreSection
              titre={t("30 derniers jours", "Last 30 days")}
              action={
                <Link href="/statistiques" className="transition-colors hover:text-encre">
                  {t("Statistiques", "Statistics")}
                </Link>
              }
            />
            {recent.seances === 0 ? (
              <p className="boite px-4 py-4 text-[13px] leading-relaxed text-brume">
                {t(
                  "Les moyennes apparaîtront après ta première séance.",
                  "Averages will show up after your first workout.",
                )}
              </p>
            ) : (
              <GrilleStats>
                <Stat
                  libelle={t("Par séance", "Per workout")}
                  valeur={nombre(Math.round(recent.kcal / recent.seances), langue)}
                  unite="kcal"
                />
                <Stat
                  libelle={t("Par semaine", "Per week")}
                  valeur={nombre(Math.round(recent.kcal / semainesRecentes), langue)}
                  unite="kcal"
                />
                <Stat
                  libelle={t("Séances par semaine", "Workouts per week")}
                  valeur={nombre(recent.seances / semainesRecentes, langue)}
                />
                <Stat
                  libelle={t("Durée moyenne", "Average duration")}
                  valeur={libelleDuree(recent.dureeMin / recent.seances, langue)}
                />
              </GrilleStats>
            )}
          </Carte>

          <Link
            href="/chronometre"
            className="boite flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-creux"
          >
            <IconeChrono className="h-5 w-5 text-accent-texte" />
            <span className="flex-1 text-[15px] font-medium">
              {t("Chronomètre d'intervalles", "Interval timer")}
            </span>
            <IconeChevronDroite className="h-4 w-4 text-brume" />
          </Link>
        </Colonne>
      </Colonnes>
    </div>
  );
}
