/** Icônes au trait, dessinées à la main pour rester cohérentes entre elles. */

type Props = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Svg({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} aria-hidden="true">
      <g {...base}>{children}</g>
    </svg>
  );
}

export function IconeAccueil(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 13.5 12 5l8 8.5" />
      <path d="M6.5 12v7h11v-7" />
      <path d="M10 19v-4h4v4" />
    </Svg>
  );
}

export function IconeHaltere(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 10v4M6 8v8M18 8v8M21 10v4" />
      <path d="M6 12h12" />
    </Svg>
  );
}

export function IconeAssiette(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </Svg>
  );
}

export function IconeLune(p: Props) {
  return (
    <Svg {...p}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </Svg>
  );
}

export function IconeCalendrier(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </Svg>
  );
}

export function IconeProfil(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </Svg>
  );
}

export function IconeCourbe(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3.5-4 3 2.2L20 7" />
    </Svg>
  );
}

export function IconeAppareilPhoto(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3.5 8.5h3l1.6-2.3h7.8L17.5 8.5h3v10h-17Z" />
      <circle cx="12" cy="13" r="3.4" />
    </Svg>
  );
}

export function IconeTexte(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 6h16M4 11h16M4 16h10" />
    </Svg>
  );
}

export function IconeEclair(p: Props) {
  return (
    <Svg {...p}>
      <path d="M13.5 3 6 13.5h5L10.5 21 18 10.5h-5Z" />
    </Svg>
  );
}

export function IconeCoche(p: Props) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  );
}

export function IconePlus(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconeFleche(p: Props) {
  return (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconeChevronGauche(p: Props) {
  return (
    <Svg {...p}>
      <path d="m14.5 6-6 6 6 6" />
    </Svg>
  );
}

export function IconeChevronDroite(p: Props) {
  return (
    <Svg {...p}>
      <path d="m9.5 6 6 6-6 6" />
    </Svg>
  );
}

export function IconeCroix(p: Props) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconeCorbeille(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4.5 6.5h15M9 6.5V4.5h6v2M6.5 6.5 7.5 20h9l1-13.5" />
    </Svg>
  );
}

export function IconeHorloge(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.5V12l3 1.8" />
    </Svg>
  );
}

export function IconeReglages(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="10" cy="17" r="2.2" />
    </Svg>
  );
}

export function IconeBalance(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M8 10.5a4.6 4.6 0 0 1 8 0" />
      <path d="m12 10.5-1.6 2.4" />
    </Svg>
  );
}

export function IconePanier(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3.5 7.5h17l-1.7 10a2 2 0 0 1-2 1.7H7.2a2 2 0 0 1-2-1.7Z" />
      <path d="M8.5 7.5 10 3.5M15.5 7.5 14 3.5" />
      <path d="M9.5 11.5v4M14.5 11.5v4" />
    </Svg>
  );
}
