"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconePlus } from "@/composants/icones";
import { LigneSeance } from "@/composants/seance";
import { Bouton, Carte, Chargement, EnTetePage, EtatVide, TitreSection } from "@/composants/ui";
import { libelleMois } from "@/lib/dates";
import { totaux, type Seance } from "@/lib/seances";

export default function PageJournal() {
  const seances = useQuery(api.seances.mesSeances);
  if (seances === undefined) return <Chargement />;

  // La requête renvoie déjà les séances de la plus récente à la plus
  // ancienne : il suffit de couper la liste à chaque changement de mois.
  const mois: { cle: string; seances: Seance[] }[] = [];
  for (const s of seances) {
    const cle = s.date.slice(0, 7);
    if (mois.at(-1)?.cle !== cle) mois.push({ cle, seances: [] });
    mois.at(-1)!.seances.push(s);
  }

  const ajouter = (
    <Link href="/seance">
      <Bouton taille="petite">
        <IconePlus className="h-3.5 w-3.5" />
        Ajouter
      </Bouton>
    </Link>
  );

  return (
    <div className="lg:max-w-[640px]">
      <EnTetePage
        surtitre={
          seances.length > 0
            ? `${seances.length} séance${seances.length > 1 ? "s" : ""}`
            : undefined
        }
        titre="Journal"
        action={seances.length > 0 ? ajouter : undefined}
      />

      {seances.length === 0 ? (
        <EtatVide
          titre="Aucune séance pour l'instant"
          detail="Note ta première séance : ce que tu as fait, combien de temps. Les statistiques se construisent à partir de là."
          action={
            <Link href="/seance">
              <Bouton>Ajouter une séance</Bouton>
            </Link>
          }
        />
      ) : (
        <div className="space-y-9">
          {mois.map(({ cle, seances: duMois }) => {
            const t = totaux(duMois);
            return (
              <Carte key={cle}>
                <TitreSection
                  titre={libelleMois(`${cle}-01`)}
                  action={
                    <span className="chiffres text-[12px] text-brume">
                      {t.seances} · {t.kcal.toLocaleString("fr-FR")} kcal
                    </span>
                  }
                />
                {/* Le titre porte déjà un filet : la première ligne n'en
                    remet pas un second juste en dessous. */}
                <div className="[&>a:first-child]:border-t-0 [&>a:first-child]:pt-1">
                  {duMois.map((s) => (
                    <LigneSeance key={s._id} seance={s} />
                  ))}
                </div>
              </Carte>
            );
          })}
        </div>
      )}
    </div>
  );
}
