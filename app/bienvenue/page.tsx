"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { ChampNombre } from "@/composants/champ-nombre";
import { Bouton, Champ, Chargement, Message } from "@/composants/ui";

/**
 * Premier passage : deux questions, pas davantage.
 *
 * Le prénom sert à l'accueil, le poids à l'estimation des calories. Tout le
 * reste se déduit des séances qu'on note ensuite.
 */
export default function PageBienvenue() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profil = useQuery(api.profils.monProfil, isAuthenticated ? {} : "skip");
  const enregistrerProfil = useMutation(api.profils.enregistrerProfil);
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

  const poidsValide = poidsKg !== undefined && poidsKg >= 30 && poidsKg <= 250;

  async function commencer() {
    if (!poidsValide) return;
    setErreur(null);
    setEnCours(true);
    try {
      await enregistrerProfil({ prenom: prenom.trim() || "Toi", poidsKg });
      router.replace("/");
    } catch {
      setErreur("L'enregistrement a échoué. Réessaie dans un instant.");
      setEnCours(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[560px] px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))] lg:pb-16 lg:pt-16">
      <header className="mb-8">
        <p className="surtitre mb-3">Bienvenue</p>
        <h1 className="titre text-[30px] font-bold leading-[1.05]">
          Deux questions, et c&apos;est parti
        </h1>
      </header>

      <div className="apparition space-y-3.5">
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
          max={250}
          onValeur={setPoidsKg}
        />
        <p className="text-[11px] leading-relaxed text-brume-faible">
          Le poids sert uniquement à estimer les calories dépensées pendant tes
          séances. Il se change depuis le profil.
        </p>
      </div>

      {erreur && <Message ton="erreur" className="mt-5">{erreur}</Message>}

      <Bouton
        taille="large"
        className="mt-8"
        disabled={enCours || !poidsValide}
        onClick={commencer}
      >
        {enCours ? "Un instant…" : "Commencer"}
      </Bouton>
    </main>
  );
}
