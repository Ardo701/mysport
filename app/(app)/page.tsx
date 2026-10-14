"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { GrilleStats, Stat } from "@/composants/jauges";
import { IconeChevronDroite, IconeChrono, IconePlus } from "@/composants/icones";
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
  JOURS_COURTS,
  ajouterJours,
  aujourdhuiISO,
  libelleDate,
  lundiDeLaSemaine,
} from "@/lib/dates";
import { entre, libelleDuree, nombre, totaux } from "@/lib/seances";

function salutation() {
  const h = new Date().getHours();
  if (h < 5 || h >= 18) return "Bonsoir";
  return "Bonjour";
}

export default function PageAccueil() {
  // La date vient de l'appareil, pas du serveur : elle n'existe qu'une fois la
  // page chargée dans le navigateur.
  const [aujourdhui, setAujourdhui] = useState<string | null>(null);
  useEffect(() => setAujourdhui(aujourdhuiISO()), []);

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
        surtitre={libelleDate(aujourdhui)}
        titre={`${salutation()}, ${profil.prenom}`}
      />

      <Colonnes>
        <Colonne>
          <Carte>
            <TitreSection titre="Cette semaine" />
            <div className="boite p-4">
              <div className="grid grid-cols-7 gap-1.5">
                {JOURS_COURTS.map((lettre, i) => {
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
                        aria-label={actif ? "séance" : undefined}
                        className={`mt-1 h-1.5 w-full rounded-full ${actif ? "bg-accent" : "bg-piste"}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 border-t border-trait pt-3.5">
                {[
                  { libelle: "séances", valeur: String(semaine.seances) },
                  { libelle: "de sport", valeur: libelleDuree(semaine.dureeMin) },
                  { libelle: "kcal", valeur: semaine.kcal.toLocaleString("fr-FR") },
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
            Ajouter une séance
          </BoutonLien>

          <Carte>
            <TitreSection
              titre="Dernières séances"
              action={
                seances.length > 0 ? (
                  <Link href="/journal" className="transition-colors hover:text-encre">
                    Tout le journal
                  </Link>
                ) : undefined
              }
            />
            {seances.length === 0 ? (
              <p className="boite px-4 py-4 text-[13px] leading-relaxed text-brume">
                Rien pour l&apos;instant. Chaque séance notée alimente le journal et
                les statistiques.
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
              titre="30 derniers jours"
              action={
                <Link href="/statistiques" className="transition-colors hover:text-encre">
                  Statistiques
                </Link>
              }
            />
            {recent.seances === 0 ? (
              <p className="boite px-4 py-4 text-[13px] leading-relaxed text-brume">
                Les moyennes apparaîtront après ta première séance.
              </p>
            ) : (
              <GrilleStats>
                <Stat
                  libelle="Par séance"
                  valeur={Math.round(recent.kcal / recent.seances).toLocaleString("fr-FR")}
                  unite="kcal"
                />
                <Stat
                  libelle="Par semaine"
                  valeur={Math.round(recent.kcal / semainesRecentes).toLocaleString("fr-FR")}
                  unite="kcal"
                />
                <Stat
                  libelle="Séances par semaine"
                  valeur={nombre(recent.seances / semainesRecentes)}
                />
                <Stat
                  libelle="Durée moyenne"
                  valeur={libelleDuree(recent.dureeMin / recent.seances)}
                />
              </GrilleStats>
            )}
          </Carte>

          <Link
            href="/chronometre"
            className="boite flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-creux"
          >
            <IconeChrono className="h-5 w-5 text-accent-texte" />
            <span className="flex-1 text-[15px] font-medium">Chronomètre d&apos;intervalles</span>
            <IconeChevronDroite className="h-4 w-4 text-brume" />
          </Link>
        </Colonne>
      </Colonnes>
    </div>
  );
}
