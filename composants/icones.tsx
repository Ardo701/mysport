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

export function IconeLune(p: Props) {
  return (
    <Svg {...p}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </Svg>
  );
}

export function IconeSoleil(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2" />
      <path d="M5.4 5.4 7 7M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
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

export function IconeChrono(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V10M10 3.5h4M12 3.5v3M17.6 7.9l1.4-1.4" />
    </Svg>
  );
}

