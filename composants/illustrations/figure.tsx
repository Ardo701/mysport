/*
 * De quoi dessiner une silhouette au trait, et rien de plus.
 *
 * Un exercice se comprend à trois choses : la position du corps, ce qu'on a
 * dans les mains, et le chemin que suit le mouvement. Le reste — les muscles
 * ombrés, le décor de salle, le visage — n'apprend rien et coûte de la
 * lisibilité à la taille où ces dessins sont réellement vus, une centaine de
 * pixels de haut sur un téléphone.
 *
 * La silhouette est donc un squelette : neuf articulations nommées, reliées
 * par des traits épais aux bouts arrondis. Deux jambes et deux bras seraient
 * illisibles de profil, où ils se superposent ; on n'en dessine qu'un de
 * chaque, comme un pictogramme.
 *
 * Le repère fait 240 × 150, sol à 134, une silhouette debout mesurant 118 de
 * haut. Toutes les scènes partagent ces valeurs, sans quoi deux dessins
 * voisins n'auraient pas la même échelle.
 */

export type Point = [number, number];

/**
 * Les membres du fond : le bras et la jambe de l'autre côté du corps.
 *
 * De profil ils se confondent avec ceux du devant, et on s'en passe presque
 * partout. Presque : une fente sans jambe arrière n'est pas une fente, un
 * squat sans les deux pieds ne tient pas debout. Ils se dessinent alors en
 * retrait, plus pâles, comme sur n'importe quel pictogramme.
 */
export type Membres = {
  coude?: Point;
  main?: Point;
  genou?: Point;
  cheville?: Point;
  pied?: Point;
};

/** Les neuf articulations. Vue de profil, le personnage regarde vers la droite. */
export type Pose = {
  tete: Point;
  cou: Point;
  epaule: Point;
  coude: Point;
  main: Point;
  bassin: Point;
  genou: Point;
  cheville: Point;
  pied: Point;
  loin?: Membres;
};

export const SOL = 134;
export const RAYON_TETE = 8;

const CORPS = "var(--color-encre)";
const MATERIEL = "var(--color-brume-faible)";
const ACCENT = "var(--color-jaune)";
const DECOR = "var(--color-trait)";

/*
 * Les segments, du plus gros au plus fin. L'ordre est celui du tracé : le
 * torse passe sous le bras, qui passe sous la tête, comme sur un dessin fait
 * à la main.
 */
type Articulation = Exclude<keyof Pose, "loin">;

const SEGMENTS: { de: Articulation; vers: Articulation; epaisseur: number }[] = [
  { de: "bassin", vers: "genou", epaisseur: 7.5 },
  { de: "genou", vers: "cheville", epaisseur: 6.5 },
  { de: "cheville", vers: "pied", epaisseur: 5 },
  { de: "cou", vers: "bassin", epaisseur: 9.5 },
  { de: "epaule", vers: "coude", epaisseur: 6.5 },
  { de: "coude", vers: "main", epaisseur: 5.5 },
];

function memePoint(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5;
}

/**
 * La silhouette, et la position de départ en filigrane s'il y en a une.
 *
 * `depart` ne redit que les articulations qui bougent : un curl ne déplace que
 * le coude et la main. On ne repasse donc en filigrane que les segments dont
 * une extrémité a changé — dessiner deux fois le corps entier pour un
 * mouvement de l'avant-bras brouillerait le dessin au lieu de l'expliquer.
 */
export function Silhouette({
  pose,
  depart,
}: {
  pose: Pose;
  depart?: Partial<Pose>;
}) {
  const poseDepart: Pose | null = depart ? { ...pose, ...depart } : null;
  const loin = pose.loin;

  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {loin && (
        <g stroke={CORPS} opacity={0.42}>
          {loin.coude && loin.main && (
            <>
              <line
                x1={pose.epaule[0]}
                y1={pose.epaule[1]}
                x2={loin.coude[0]}
                y2={loin.coude[1]}
                strokeWidth={6.5}
              />
              <line
                x1={loin.coude[0]}
                y1={loin.coude[1]}
                x2={loin.main[0]}
                y2={loin.main[1]}
                strokeWidth={5.5}
              />
            </>
          )}
          {loin.genou && loin.cheville && (
            <>
              <line
                x1={pose.bassin[0]}
                y1={pose.bassin[1]}
                x2={loin.genou[0]}
                y2={loin.genou[1]}
                strokeWidth={7.5}
              />
              <line
                x1={loin.genou[0]}
                y1={loin.genou[1]}
                x2={loin.cheville[0]}
                y2={loin.cheville[1]}
                strokeWidth={6.5}
              />
              {loin.pied && (
                <line
                  x1={loin.cheville[0]}
                  y1={loin.cheville[1]}
                  x2={loin.pied[0]}
                  y2={loin.pied[1]}
                  strokeWidth={5}
                />
              )}
            </>
          )}
        </g>
      )}
      {poseDepart && (
        <g stroke={CORPS} opacity={0.22}>
          {SEGMENTS.filter(
            (s) =>
              !memePoint(pose[s.de], poseDepart[s.de]) ||
              !memePoint(pose[s.vers], poseDepart[s.vers]),
          ).map((s) => (
            <line
              key={`${s.de}-${s.vers}`}
              x1={poseDepart[s.de][0]}
              y1={poseDepart[s.de][1]}
              x2={poseDepart[s.vers][0]}
              y2={poseDepart[s.vers][1]}
              strokeWidth={s.epaisseur}
            />
          ))}
          {!memePoint(pose.tete, poseDepart.tete) && (
            <circle
              cx={poseDepart.tete[0]}
              cy={poseDepart.tete[1]}
              r={RAYON_TETE}
              strokeWidth={3}
            />
          )}
        </g>
      )}

      <g stroke={CORPS}>
        {SEGMENTS.map((s) => (
          <line
            key={`${s.de}-${s.vers}`}
            x1={pose[s.de][0]}
            y1={pose[s.de][1]}
            x2={pose[s.vers][0]}
            y2={pose[s.vers][1]}
            strokeWidth={s.epaisseur}
          />
        ))}
      </g>
      <circle
        cx={pose.tete[0]}
        cy={pose.tete[1]}
        r={RAYON_TETE}
        fill={CORPS}
      />
    </g>
  );
}

/*
 * Le chemin du mouvement, en jaune : c'est la seule chose colorée du dessin,
 * donc la première que l'œil trouve.
 *
 * La courbure écarte le trait du corps — une flèche droite passerait souvent
 * à travers le buste. La pointe est calculée depuis la tangente d'arrivée
 * plutôt que posée en marqueur : un marqueur SVG demande un identifiant, et
 * deux illustrations sur la même page se voleraient le leur.
 */
export function Fleche({
  de,
  vers,
  courbure = 0,
  double = false,
}: {
  de: Point;
  vers: Point;
  courbure?: number;
  double?: boolean;
}) {
  const [ax, ay] = de;
  const [bx, by] = vers;
  const dx = bx - ax;
  const dy = by - ay;
  const longueur = Math.hypot(dx, dy) || 1;
  // Contrôle placé sur la perpendiculaire au milieu du segment.
  const cx = (ax + bx) / 2 - (dy / longueur) * courbure;
  const cy = (ay + by) / 2 + (dx / longueur) * courbure;

  return (
    <g stroke={ACCENT} fill={ACCENT} strokeLinecap="round">
      <path
        d={`M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`}
        strokeWidth={2.6}
        fill="none"
      />
      <PointeFleche vers={vers} depuis={[cx, cy]} />
      {double && <PointeFleche vers={de} depuis={[cx, cy]} />}
    </g>
  );
}

/** Le triangle de la pointe, orienté par la tangente d'arrivée. */
function PointeFleche({ vers, depuis }: { vers: Point; depuis: Point }) {
  const angle = Math.atan2(vers[1] - depuis[1], vers[0] - depuis[0]);
  const points: Point[] = [
    vers,
    [
      vers[0] - 10 * Math.cos(angle - 0.42),
      vers[1] - 10 * Math.sin(angle - 0.42),
    ],
    [
      vers[0] - 10 * Math.cos(angle + 0.42),
      vers[1] - 10 * Math.sin(angle + 0.42),
    ],
  ];
  return <polygon points={points.map((p) => p.join(",")).join(" ")} stroke="none" />;
}

/* --- Décor et matériel ------------------------------------------------- */

/** Le sol, en pointillé : un trait plein passerait pour un support. */
export function Sol({ y = SOL }: { y?: number }) {
  return (
    <line
      x1={8}
      y1={y}
      x2={232}
      y2={y}
      stroke={DECOR}
      strokeWidth={2}
      strokeDasharray="5 5"
      strokeLinecap="round"
    />
  );
}

const materiel = {
  stroke: MATERIEL,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Une barre chargée, vue de profil : la barre en bout, les disques de côté. */
export function Barre({ x, y, rayon = 13 }: { x: number; y: number; rayon?: number }) {
  return (
    <g {...materiel}>
      <circle cx={x} cy={y} r={rayon} strokeWidth={3.5} />
      <circle cx={x} cy={y} r={3} fill={MATERIEL} stroke="none" />
    </g>
  );
}

/** Une barre vue de face : le manche et deux disques. */
export function BarreDeFace({
  x,
  y,
  demiLongueur = 34,
}: {
  x: number;
  y: number;
  demiLongueur?: number;
}) {
  return (
    <g {...materiel}>
      <line
        x1={x - demiLongueur}
        y1={y}
        x2={x + demiLongueur}
        y2={y}
        strokeWidth={3.5}
      />
      {[-1, 1].map((c) => (
        <line
          key={c}
          x1={x + c * (demiLongueur - 7)}
          y1={y - 11}
          x2={x + c * (demiLongueur - 7)}
          y2={y + 11}
          strokeWidth={5}
        />
      ))}
    </g>
  );
}

/** Un haltère, tenu verticalement ou horizontalement. */
export function Haltere({
  x,
  y,
  vertical = false,
}: {
  x: number;
  y: number;
  vertical?: boolean;
}) {
  const [dx, dy] = vertical ? [0, 1] : [1, 0];
  return (
    <g {...materiel}>
      <line
        x1={x - dx * 9}
        y1={y - dy * 9}
        x2={x + dx * 9}
        y2={y + dy * 9}
        strokeWidth={3}
      />
      {[-1, 1].map((c) => (
        <line
          key={c}
          x1={x + c * dx * 9 - dy * 6}
          y1={y + c * dy * 9 - dx * 6}
          x2={x + c * dx * 9 + dy * 6}
          y2={y + c * dy * 9 + dx * 6}
          strokeWidth={4.5}
        />
      ))}
    </g>
  );
}

/**
 * Un banc, incliné ou plat, avec ses pieds.
 *
 * L'inclinaison pivote autour du bord bas, celui des fesses : c'est ce point
 * qui reste posé quand on relève un dossier.
 */
export function Banc({
  x,
  y,
  longueur = 82,
  angle = 0,
}: {
  x: number;
  y: number;
  longueur?: number;
  angle?: number;
}) {
  const r = (angle * Math.PI) / 180;
  const bx = x + longueur * Math.cos(r);
  const by = y - longueur * Math.sin(r);
  return (
    <g {...materiel}>
      <line x1={x} y1={y} x2={bx} y2={by} strokeWidth={6} />
      <line x1={x + 8} y1={y} x2={x + 8} y2={SOL} strokeWidth={3} />
      <line
        x1={bx - 8 * Math.cos(r)}
        y1={by + 8 * Math.sin(r)}
        x2={bx - 8 * Math.cos(r)}
        y2={SOL}
        strokeWidth={3}
      />
    </g>
  );
}

/** Un montant de machine ou de poulie, avec le câble jusqu'à la poignée. */
export function Poulie({
  x,
  yHaut,
  vers,
}: {
  x: number;
  yHaut: number;
  vers: Point;
}) {
  return (
    <g {...materiel}>
      <line x1={x} y1={yHaut - 6} x2={x} y2={SOL} strokeWidth={3.5} />
      <circle cx={x} cy={yHaut} r={5} strokeWidth={2.5} />
      <line x1={x} y1={yHaut + 5} x2={vers[0]} y2={vers[1]} strokeWidth={2} />
    </g>
  );
}

/** Un élastique : une ondulation, pour qu'il ne passe pas pour un câble. */
export function Elastique({ de, vers }: { de: Point; vers: Point }) {
  const [ax, ay] = de;
  const [bx, by] = vers;
  const longueur = Math.hypot(bx - ax, by - ay) || 1;
  // Une ondulation par quinze unités : à nombre d'ondes fixe, une bande
  // longue se dessinait en larges vagues qu'on prenait pour un ruban.
  const n = Math.min(12, Math.max(4, Math.round(longueur / 15)));
  const dx = (bx - ax) / n;
  const dy = (by - ay) / n;
  const px = (-(by - ay) / longueur) * 2.6;
  const py = ((bx - ax) / longueur) * 2.6;

  let d = `M ${ax} ${ay}`;
  for (let i = 0; i < n; i += 1) {
    const c = i % 2 === 0 ? 1 : -1;
    d += ` Q ${ax + dx * (i + 0.5) + px * c} ${ay + dy * (i + 0.5) + py * c} ${
      ax + dx * (i + 1)
    } ${ay + dy * (i + 1)}`;
  }
  return <path d={d} {...materiel} strokeWidth={2.5} />;
}

/** Un sac à dos chargé, avec sa bretelle. */
export function SacADos({ x, y }: { x: number; y: number }) {
  return (
    <g {...materiel}>
      <rect x={x - 9} y={y - 10} width={18} height={21} rx={4} strokeWidth={3} />
      <line x1={x - 9} y1={y - 5} x2={x + 9} y2={y - 5} strokeWidth={2} />
    </g>
  );
}

/** Une chaise, de profil. */
export function Chaise({ x, y }: { x: number; y: number }) {
  return (
    <g {...materiel}>
      <line x1={x - 16} y1={y} x2={x + 16} y2={y} strokeWidth={4} />
      <line x1={x + 16} y1={y} x2={x + 16} y2={y - 28} strokeWidth={3} />
      <line x1={x - 13} y1={y} x2={x - 13} y2={SOL} strokeWidth={3} />
      <line x1={x + 14} y1={y} x2={x + 14} y2={SOL} strokeWidth={3} />
    </g>
  );
}

/**
 * Une table ou un plan de travail : plateau et pieds.
 *
 * `pieds` sert au rowing australien, où le corps passe sous le plateau : le
 * pied du côté du corps le traverserait, et un trait qui traverse un torse se
 * lit comme une erreur de dessin, pas comme de la perspective.
 */
export function Table({
  x,
  y,
  demiLongueur = 34,
  pieds = "deux",
}: {
  x: number;
  y: number;
  demiLongueur?: number;
  pieds?: "deux" | "droit";
}) {
  const cotes = pieds === "droit" ? [1] : [-1, 1];
  return (
    <g {...materiel}>
      <line x1={x - demiLongueur} y1={y} x2={x + demiLongueur} y2={y} strokeWidth={4} />
      {cotes.map((c) => (
        <line
          key={c}
          x1={x + c * (demiLongueur - 4)}
          y1={y}
          x2={x + c * (demiLongueur - 4)}
          y2={SOL}
          strokeWidth={3}
        />
      ))}
    </g>
  );
}

/** Une barre fixe en hauteur, sur ses montants. */
export function BarreFixe({ x, y }: { x: number; y: number }) {
  return (
    <g {...materiel}>
      <line x1={x - 40} y1={y} x2={x + 40} y2={y} strokeWidth={3.5} />
      {[-1, 1].map((c) => (
        <line
          key={c}
          x1={x + c * 38}
          y1={y}
          x2={x + c * 38}
          y2={y + 14}
          strokeWidth={3}
        />
      ))}
    </g>
  );
}

/** Une marche d'escalier. */
export function Marche({ x, y }: { x: number; y: number }) {
  return (
    <g {...materiel}>
      <path
        d={`M ${x - 26} ${SOL} L ${x - 26} ${y} L ${x + 26} ${y}`}
        strokeWidth={3.5}
      />
    </g>
  );
}

/** Un tapis de sol, posé au sol et un peu plus épais que lui. */
export function Tapis({ x = 120, demiLongueur = 74 }: { x?: number; demiLongueur?: number }) {
  return (
    <line
      x1={x - demiLongueur}
      y1={SOL}
      x2={x + demiLongueur}
      y2={SOL}
      stroke={MATERIEL}
      strokeWidth={4}
      strokeLinecap="round"
    />
  );
}

/** Le bâti d'une machine : deux montants et une traverse. */
export function Machine({
  x,
  yHaut,
  demiLargeur = 30,
}: {
  x: number;
  yHaut: number;
  demiLargeur?: number;
}) {
  return (
    <g {...materiel}>
      <line
        x1={x - demiLargeur}
        y1={yHaut}
        x2={x + demiLargeur}
        y2={yHaut}
        strokeWidth={3.5}
      />
      {[-1, 1].map((c) => (
        <line
          key={c}
          x1={x + c * demiLargeur}
          y1={yHaut}
          x2={x + c * demiLargeur}
          y2={SOL}
          strokeWidth={3.5}
        />
      ))}
    </g>
  );
}

/**
 * L'axe du corps, en jaune, pour les exercices qui ne bougent pas.
 *
 * Une planche ou un gainage latéral n'ont pas de trajectoire : y mettre une
 * flèche inventerait un mouvement. Ce qui s'y joue, c'est l'alignement — et
 * c'est donc lui qu'on souligne.
 */
export function Axe({ de, vers }: { de: Point; vers: Point }) {
  return (
    <line
      x1={de[0]}
      y1={de[1]}
      x2={vers[0]}
      y2={vers[1]}
      stroke={ACCENT}
      strokeWidth={2.4}
      strokeDasharray="7 6"
      strokeLinecap="round"
    />
  );
}

/** Le « + » entre deux mouvements enchaînés d'un même superset. */
export function Plus({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={MATERIEL} strokeWidth={3} strokeLinecap="round">
      <line x1={x - 6} y1={y} x2={x + 6} y2={y} />
      <line x1={x} y1={y - 6} x2={x} y2={y + 6} />
    </g>
  );
}

/** Un câble de machine, tendu entre deux points. */
export function Cable({ de, vers }: { de: Point; vers: Point }) {
  return (
    <line
      x1={de[0]}
      y1={de[1]}
      x2={vers[0]}
      y2={vers[1]}
      stroke={MATERIEL}
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}
