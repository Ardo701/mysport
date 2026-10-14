"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { POIDS_MAX, poidsValide } from "@/convex/lib/poids";
import { ChampNombre } from "@/composants/champ-nombre";
import { Bouton, Champ, Chargement, Message } from "@/composants/ui";
import { aujourdhuiISO } from "@/lib/dates";

/**
 * Premier passage : deux questions, pas davantage.
 *
 * Le prénom sert à l'accueil, le poids à l'estimation des calories. Tout le
 * reste se déduit des séances qu'on note ensuite.
 */
export default function PageBienvenue() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profil = useQuery(api.profils.monProfil, isAuthenticated ? {} : "skip");
  const creerProfil = useMutation(api.profils.creerProfil);
  const router = useRouter();

  const [prenom, setPrenom] = useState("");
  const [poidsKg, setPoidsKg] = useState<number | undefined>(undefined);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/connexion");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profil) router.replace("/");
  }, [profil, router]);

  if (isLoading || !isAuthenticated || profil === undefined || profil) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[560px] items-center justify-center px-5">
        <Chargement />
      </main>
    );
  }

  async function commencer() {
    if (!poidsValide(poidsKg)) return;
    setErreur(null);
    setEnCours(true);
    try {
      await creerProfil({ prenom: prenom.trim() || "Toi", poidsKg, date: aujourdhuiISO() });
      router.replace("/");
    } catch {
      setErreur("L'enregistrement a échoué. Réessaie dans un instant.");
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[560px] px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))] lg:pb-16 lg:pt-16">
      <header className="mb-8">
        <p className="mb-1.5 text-[13px] font-medium text-brume">Bienvenue</p>
        <h1 className="titre text-[30px] font-bold leading-[1.05]">
          Deux questions, et c&apos;est parti
        </h1>
      </header>

      <div className="apparition boite space-y-3.5 p-5">
        <Champ
          libelle="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Comment on t'appelle ?"
          className="!font-sans"
        />
        <ChampNombre
          libelle="Poids"
          suffixe="kg"
          placeholder="80"
          decimales
          valeur={poidsKg}
          max={POIDS_MAX}
          onValeur={setPoidsKg}
        />
        <p className="text-[12px] leading-relaxed text-brume">
          Le poids sert uniquement à estimer les calories dépensées pendant tes
          séances. Tu pourras noter son évolution depuis le profil.
        </p>
      </div>

      {erreur && <Message ton="erreur" className="mt-5">{erreur}</Message>}

      <Bouton
        taille="large"
        className="mt-8"
        disabled={enCours || !poidsValide(poidsKg)}
        onClick={commencer}
      >
        {enCours ? "Un instant…" : "Commencer"}
      </Bouton>
    </main>
  );
}
