"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconePlus } from "@/composants/icones";
import { useLangue } from "@/composants/langue";
import { LigneSeance } from "@/composants/seance";
import {
  ActionTete,
  BoutonLien,
  Carte,
  Chargement,
  EnTetePage,
  EtatVide,
  TitreSection,
} from "@/composants/ui";
import { libelleMois } from "@/lib/dates";
import { compteSeances, nombre, totaux, type Seance } from "@/lib/seances";

export default function PageJournal() {
  const { langue, t } = useLangue();
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
    <ActionTete href="/seance" libelle={t("Ajouter une séance", "Add a workout")}>
      <IconePlus className="h-[22px] w-[22px]" />
    </ActionTete>
  );

  return (
    <div className="lg:max-w-[640px]">
      <EnTetePage
        surtitre={seances.length > 0 ? compteSeances(seances.length, langue) : undefined}
        titre={t("Journal", "Log")}
        action={seances.length > 0 ? ajouter : undefined}
      />

      {seances.length === 0 ? (
        <EtatVide
          titre={t("Aucune séance pour l'instant", "No workouts yet")}
          detail={t(
            "Note ta première séance : ce que tu as fait, combien de temps. Les statistiques se construisent à partir de là.",
            "Log your first workout: what you did, and for how long. The statistics build up from there.",
          )}
          action={<BoutonLien href="/seance">{t("Ajouter une séance", "Add a workout")}</BoutonLien>}
        />
      ) : (
        <div className="space-y-8">
          {mois.map(({ cle, seances: duMois }) => {
            const total = totaux(duMois);
            return (
              <Carte key={cle}>
                <TitreSection
                  titre={libelleMois(`${cle}-01`, langue)}
                  action={
                    <span className="chiffres">
                      {compteSeances(total.seances, langue)} · {nombre(total.kcal, langue)} kcal
                    </span>
                  }
                />
                <div className="boite divide-y divide-trait overflow-hidden">
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
