"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Stat } from "@/composants/jauges";
import { IconeChrono, IconeFleche, IconePlus } from "@/composants/icones";
import { LigneSeance } from "@/composants/seance";
import {
  Bouton,
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
            <div className="grid grid-cols-7">
              {JOURS_COURTS.map((lettre, i) => {
                const jour = ajouterJours(lundi, i);
                const actif = joursActifs.has(jour);
                const estAujourdhui = jour === aujourdhui;
                return (
                  <div key={jour} className="flex flex-col items-center gap-2 py-1">
                    <span className="surtitre">{lettre}</span>
                    <span
                      className={`chiffres text-[15px] leading-none ${
                        estAujourdhui ? "font-semibold text-encre" : "text-brume"
                      }`}
                    >
                      {Number(jour.slice(8))}
                    </span>
                    <span
                      aria-label={actif ? "séance" : undefined}
                      className={`h-1.5 w-5 ${actif ? "bg-jaune-vif" : "bg-trait"}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Stat libelle="Séances" valeur={semaine.seances} />
              <Stat libelle="Temps" valeur={libelleDuree(semaine.dureeMin)} />
              <Stat
                libelle="Dépense"
                valeur={semaine.kcal.toLocaleString("fr-FR")}
                unite="kcal"
              />
            </div>
          </Carte>

          <Link href="/seance" className="block">
            <Bouton taille="large">
              <IconePlus className="h-4 w-4" />
              Ajouter une séance
            </Bouton>
          </Link>

          <Carte>
            <TitreSection
              titre="Dernières séances"
              action={
                seances.length > 0 ? (
                  <Link href="/journal" className="text-[12px] text-brume transition-colors hover:text-encre">
                    Tout le journal
                  </Link>
                ) : undefined
              }
            />
            {seances.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-brume">
                Rien pour l&apos;instant. Chaque séance notée alimente le journal et
                les statistiques.
              </p>
            ) : (
              <div className="[&>a:first-child]:border-t-0 [&>a:first-child]:pt-1">
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
                <Link href="/statistiques" className="text-[12px] text-brume transition-colors hover:text-encre">
                  Statistiques
                </Link>
              }
            />
            {recent.seances === 0 ? (
              <p className="text-[13px] leading-relaxed text-brume">
                Les moyennes apparaîtront après ta première séance.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
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
              </div>
            )}
          </Carte>

          <Link href="/chronometre" className="group block">
            <div className="flex items-center justify-between border-t border-trait px-1 py-3.5 transition-colors group-hover:border-trait-vif">
              <span className="flex items-center gap-3 text-[14px]">
                <IconeChrono className="h-4.5 w-4.5 text-jaune" />
                Chronomètre d&apos;intervalles
              </span>
              <IconeFleche className="h-4 w-4 text-brume-faible transition-colors group-hover:text-encre" />
            </div>
          </Link>
        </Colonne>
      </Colonnes>
    </div>
  );
}
