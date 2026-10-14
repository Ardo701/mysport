"use client";

import { useEffect, type ReactNode } from "react";
import { IconeCroix } from "./icones";
import { useLangue } from "./langue";

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
  const { t } = useLangue();

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
        aria-label={t("Fermer", "Close")}
        onClick={onFermer}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        className="apparition relative mx-auto flex max-h-[92dvh] w-full max-w-[560px] flex-col rounded-t-[14px] border-x border-t border-trait bg-surface lg:max-h-[84dvh] lg:rounded-boite lg:border"
      >
        <div className="flex items-start justify-between gap-4 border-b border-trait px-5 py-4">
          <div>
            {surtitre && <p className="surtitre mb-1">{surtitre}</p>}
            <h2 className="titre text-[20px] font-semibold leading-tight">{titre}</h2>
          </div>
          <button
            onClick={onFermer}
            aria-label={t("Fermer", "Close")}
            className="-mr-2 -mt-1.5 flex h-9 w-9 items-center justify-center rounded-doux text-brume transition-colors hover:bg-creux hover:text-encre"
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
