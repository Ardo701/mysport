"use client";

import { useEffect, type ReactNode } from "react";
import { IconeCroix } from "./icones";

/** Panneau glissant depuis le bas, adapté à une utilisation au pouce. */
export function Feuille({
  ouverte,
  onFermer,
  titre,
  surtitre,
  children,
}: {
  ouverte: boolean;
  onFermer: () => void;
  titre: string;
  surtitre?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!ouverte) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", surEchap);
    return () => {
      document.body.style.overflow = precedent;
      window.removeEventListener("keydown", surEchap);
    };
  }, [ouverte, onFermer]);

  if (!ouverte) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:justify-center lg:p-8">
      <button
        aria-label="Fermer"
        onClick={onFermer}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="apparition relative mx-auto flex max-h-[92dvh] w-full max-w-[560px] flex-col rounded-none border-x border-t border-trait bg-surface lg:max-h-[84dvh] lg:rounded-doux lg:border"
      >
        <div className="flex items-start justify-between gap-4 border-b border-trait px-5 py-4">
          <div>
            {surtitre && <p className="surtitre mb-2">{surtitre}</p>}
            <h2 className="titre text-[19px] font-semibold leading-tight">{titre}</h2>
          </div>
          <button
            onClick={onFermer}
            aria-label="Fermer"
            className="-mr-1 -mt-1 p-1 text-brume transition-colors hover:text-encre"
          >
            <IconeCroix className="h-5 w-5" />
          </button>
        </div>
        <div
          className="overflow-y-auto px-5 py-5"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
