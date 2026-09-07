"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { BarreLaterale, BarreNavigation } from "./navigation";
import { Chargement } from "./ui";

/**
 * Enveloppe des pages connectées : garde d'accès, largeur et navigation.
 *
 * Deux formats, pas deux applications : sous 1024 px la page est une colonne
 * unique avec la barre d'onglets en bas, au-dessus elle passe derrière une
 * colonne de navigation fixe et s'élargit pour occuper l'écran.
 */
export function Coquille({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const profil = useQuery(api.profils.monProfil, isAuthenticated ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/connexion");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && profil === null) router.replace("/bienvenue");
  }, [isAuthenticated, profil, router]);

  if (isLoading || !isAuthenticated || profil === undefined || profil === null) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[560px] items-center justify-center px-5">
        <Chargement />
      </main>
    );
  }

  return (
    <>
      <BarreLaterale prenom={profil.prenom} />
      <div className="lg:pl-[248px]">
        <main className="mx-auto min-h-dvh w-full max-w-[560px] px-5 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))] lg:max-w-[1180px] lg:px-10 lg:pb-16 lg:pt-9 xl:px-14">
          {children}
        </main>
      </div>
      <BarreNavigation />
    </>
  );
}
