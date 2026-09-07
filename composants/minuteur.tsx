"use client";

import { useEffect, useRef, useState } from "react";
import { IconeCroix } from "./icones";

/** Compte à rebours de repos entre deux séries. */
export function MinuteurRepos({
  secondes,
  onFin,
}: {
  secondes: number;
  onFin: () => void;
}) {
  const [restant, setRestant] = useState(secondes);
  const finRef = useRef(onFin);
  finRef.current = onFin;

  useEffect(() => {
    setRestant(secondes);
  }, [secondes]);

  useEffect(() => {
    if (restant <= 0) {
      finRef.current();
      return;
    }
    const t = setTimeout(() => setRestant((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restant]);

  const pourcent = secondes > 0 ? (restant / secondes) * 100 : 0;
  const minutes = Math.floor(restant / 60);
  const reste = restant % 60;

  return (
    <div
      className="fixed inset-x-0 bottom-[76px] z-50 px-5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-[560px] overflow-hidden rounded-net border border-jaune/40 bg-ardoise">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="surtitre !text-jaune">Repos</span>
          <span className="chiffres titre flex-1 text-[20px] font-semibold">
            {minutes}:{String(reste).padStart(2, "0")}
          </span>
          <button
            onClick={() => setRestant(0)}
            className="text-brume transition hover:text-craie"
            aria-label="Passer le repos"
          >
            <IconeCroix className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[3px] bg-trait">
          <div
            className="h-full bg-jaune"
            style={{ width: `${pourcent}%`, transition: "width 1s linear" }}
          />
        </div>
      </div>
    </div>
  );
}
