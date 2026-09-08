/*
 * Les quarante-deux dessins : un par exercice et par variante.
 *
 * Chaque scène suit la même grammaire, pour qu'on la lise sans l'apprendre :
 *
 *   — la silhouette pleine est la position qui nomme l'exercice : le bas d'un
 *     squat, le haut d'une traction, les bras écartés d'une élévation ;
 *   — la silhouette pâle est l'autre bout du mouvement ;
 *   — la flèche jaune donne le sens de l'effort, celui où l'on pousse ou tire ;
 *   — le gris est le matériel, jamais le corps.
 *
 * Un exercice qui ne bouge pas — une planche, un gainage — n'a pas de flèche
 * mais un axe : y dessiner une trajectoire inventerait un mouvement. Et quand
 * la position de départ ne peut pas se dessiner honnêtement, faute de place ou
 * parce qu'elle se confondrait avec l'autre, on ne dessine qu'une position et
 * la flèche dit le reste — mieux vaut une information de moins qu'une fausse.
 */

import type { ReactNode } from "react";
import {
  Axe,
  Banc,
  Barre,
  BarreDeFace,
  BarreFixe,
  Cable,
  Chaise,
  Elastique,
  Fleche,
  Haltere,
  Machine,
  Marche,
  Plus,
  Poulie,
  SacADos,
  Silhouette,
  Sol,
  Table,
  Tapis,
  type Point,
} from "./figure";
import {
  accroupi,
  allonge,
  assis,
  debout,
  deFace,
  fente,
  penche,
  planche,
  poser,
  suspendu,
  vers,
} from "./poses";

/** Une scène réduite, pour les supersets qui en montrent deux. */
function Moitie({ x, children }: { x: number; children: ReactNode }) {
  return <g transform={`translate(${x}, 34) scale(0.56)`}>{children}</g>;
}

export const SCENES: Record<string, () => ReactNode> = {
  /* ----- Poussée ------------------------------------------------------- */

  "dev-couche/salle": () => (
    <>
      <Sol />
      <Banc x={42} y={88} longueur={84} />
      <Silhouette pose={allonge(48, 88, [84, 44])} depart={allonge(48, 88, [84, 74])} />
      <Barre x={84} y={44} />
      <Fleche de={[64, 74]} vers={[64, 48]} courbure={5} />
    </>
  ),

  "dev-couche/maison": () => (
    <>
      <Sol />
      <Silhouette pose={planche(58, 86, [108, 130])} depart={planche(58, 104, [108, 130])} />
      <SacADos x={88} y={95} />
      <Fleche de={[148, 118]} vers={[148, 92]} courbure={5} />
    </>
  ),

  "dev-incline/salle": () => {
    const dos = (main: Point) =>
      poser({
        tete: [119, 74],
        cou: [108, 82],
        epaule: [110, 80],
        bassin: [77, 99],
        main,
        cheville: [48, 125],
        pied: [36, 131],
        coudeSens: -1,
        genouSens: 1,
      });
    return (
      <>
        <Sol />
        <Banc x={52} y={114} longueur={84} angle={30} />
        <Silhouette pose={dos([105, 38])} depart={dos([104, 70])} />
        <Haltere x={105} y={38} />
        <Fleche de={[86, 68]} vers={[86, 42]} courbure={5} />
      </>
    );
  },

  "dev-incline/maison": () => {
    const p = (yEpaule: number) => {
      const cou: Point = [147, yEpaule - 4];
      const cheville: Point = [56, 102];
      return poser({
        tete: [158, yEpaule - 10],
        cou,
        epaule: [150, yEpaule],
        bassin: vers(cou, cheville, 35),
        main: [152, 130],
        cheville,
        pied: [44, 99],
        coudeSens: -1,
        genouSens: 1,
      });
    };
    return (
      <>
        <Sol />
        <Table x={62} y={102} demiLongueur={28} />
        <Silhouette pose={p(88)} depart={p(106)} />
        <Fleche de={[176, 116]} vers={[176, 92]} courbure={5} />
      </>
    );
  },

  "dev-epaules/salle": () => (
    <>
      <Sol />
      <Silhouette pose={debout(106, [112, 16])} depart={debout(106, [118, 46])} />
      <Barre x={112} y={16} rayon={9} />
      <Fleche de={[142, 52]} vers={[142, 24]} courbure={5} />
    </>
  ),

  "dev-epaules/maison": () => {
    // Le bassin haut et les mains au sol fixent tout le reste : les épaules
    // tombent à la seule place qui garde le bras et le tronc à leur longueur.
    const mains: Point = [162, 130];
    const bassin: Point = [104, 76];
    const epaule = vers(mains, bassin, 44);
    return (
      <>
        <Sol />
        <Silhouette
          pose={poser({
            // Sous l'épaule et non dans l'axe du bras : alignée dessus, une
            // tête ronde au milieu d'un membre se lit comme une articulation.
            tete: [epaule[0] - 2, epaule[1] + 14],
            cou: vers(bassin, epaule, 33),
            epaule,
            bassin,
            main: mains,
            cheville: [86, 128],
            pied: [74, 132],
            coudeSens: -1,
            genouSens: -1,
          })}
        />
        <Fleche de={[186, 92]} vers={[192, 120]} courbure={-8} />
      </>
    );
  },

  "ecarte/salle": () => (
    <>
      <Sol />
      <Poulie x={24} yHaut={26} vers={[90, 64]} />
      <Poulie x={216} yHaut={26} vers={[134, 64]} />
      <Silhouette
        pose={deFace(112, [134, 64], [90, 64])}
        depart={deFace(112, [176, 54], [48, 54])}
      />
      <Fleche de={[178, 70]} vers={[146, 74]} courbure={12} />
      <Fleche de={[46, 70]} vers={[78, 74]} courbure={-12} />
    </>
  ),

  "ecarte/maison": () => (
    <>
      <Sol />
      <Elastique de={[112, 50]} vers={[90, 64]} />
      <Elastique de={[112, 50]} vers={[134, 64]} />
      <Silhouette
        pose={deFace(112, [134, 64], [90, 64])}
        depart={deFace(112, [176, 54], [48, 54])}
      />
      <Fleche de={[178, 70]} vers={[146, 74]} courbure={12} />
      <Fleche de={[46, 70]} vers={[78, 74]} courbure={-12} />
    </>
  ),

  "triceps/salle": () => (
    <>
      <Sol />
      <Poulie x={164} yHaut={26} vers={[116, 84]} />
      <Silhouette pose={debout(96, [116, 84])} depart={debout(96, [108, 58])} />
      <Fleche de={[136, 62]} vers={[138, 90]} courbure={7} />
    </>
  ),

  "triceps/maison": () => {
    /*
     * Les jambes pendent sous le bassin au lieu de partir vers l'avant.
     *
     * C'est ce qui sépare un dip d'une personne assise : les pieds posés
     * devant, le dessin de profil se lit comme quelqu'un installé sur un banc,
     * quelle que soit la hauteur des hanches. Repliées sous le corps, elles
     * disent que rien ne porte le bassin sauf les bras.
     */
    const p = (yEpaule: number, cheville: Point, pied: Point) =>
      poser({
        tete: [108, yEpaule - 18],
        cou: [105, yEpaule - 5],
        epaule: [104, yEpaule],
        bassin: [104, yEpaule + 30],
        // La main s'écarte de l'axe du corps : dans l'alignement, le bras
        // disparaît derrière le torse et l'exercice n'a plus de moteur.
        main: [116, 96],
        cheville,
        pied,
        coudeSens: -1,
        genouSens: -1,
      });
    return (
      <>
        <Sol />
        <Table x={88} y={96} demiLongueur={30} />
        <Silhouette
          pose={p(52, [84, 126], [74, 130])}
          depart={p(74, [88, 130], [78, 133])}
        />
        <Fleche de={[142, 100]} vers={[142, 70]} courbure={6} />
      </>
    );
  },

  "gainage-poussee/salle": () => (
    <>
      <Sol />
      <Silhouette pose={planche(58, 106, [124, 128], 1)} />
      <Barre x={94} y={100} rayon={9} />
      <Axe de={[124, 88]} vers={[20, 124]} />
    </>
  ),

  "gainage-poussee/maison": () => (
    <>
      <Sol />
      <Tapis x={76} demiLongueur={66} />
      <Silhouette pose={planche(58, 106, [124, 128], 1)} />
      <Axe de={[124, 88]} vers={[20, 124]} />
    </>
  ),
  /* ----- Tirage -------------------------------------------------------- */

  "traction/salle": () => {
    const haut = poser({
      tete: [119, 35],
      cou: [120, 47],
      epaule: [120, 52],
      bassin: [118, 82],
      main: [133, 32],
      cheville: [94, 124],
      pied: [84, 128],
      coudeSens: 1,
      genouSens: -1,
    });
    return (
      <>
        <Sol />
        <BarreFixe x={120} y={28} />
        <Silhouette pose={haut} depart={suspendu(120, 28)} />
        <Fleche de={[170, 106]} vers={[170, 74]} courbure={7} />
      </>
    );
  },

  "traction/maison": () => {
    const haut = poser({
      tete: [119, 41],
      cou: [120, 53],
      epaule: [120, 58],
      bassin: [118, 88],
      main: [133, 38],
      cheville: [92, 126],
      pied: [82, 130],
      coudeSens: 1,
      genouSens: -1,
    });
    return (
      <>
        <Sol />
        {/* Le chambranle, qui distingue la barre de porte de la barre fixe. */}
        <Machine x={120} yHaut={18} demiLargeur={58} />
        <BarreFixe x={120} y={34} />
        <Silhouette pose={haut} depart={suspendu(120, 34)} />
        <Fleche de={[172, 110]} vers={[172, 78]} courbure={7} />
      </>
    );
  },

  "rowing/salle": () => (
    <>
      <Sol />
      <Silhouette pose={penche(108, [116, 86])} depart={penche(108, [122, 102])} />
      <BarreDeFace x={116} y={86} demiLongueur={28} />
      <Fleche de={[150, 102]} vers={[150, 78]} courbure={-6} />
    </>
  ),

  "rowing/maison": () => {
    const p = (yEpaule: number) => {
      const cou: Point = [126, yEpaule - 3];
      const cheville: Point = [42, 128];
      return poser({
        tete: [138, yEpaule - 9],
        cou,
        epaule: [129, yEpaule],
        bassin: vers(cou, cheville, 35),
        main: [130, 80],
        cheville,
        pied: [32, 122],
        coudeSens: -1,
        genouSens: 1,
      });
    };
    return (
      <>
        <Sol />
        <Table x={178} y={78} demiLongueur={50} pieds="droit" />
        <Silhouette pose={p(95)} depart={p(120)} />
        <Fleche de={[154, 118]} vers={[154, 94]} courbure={6} />
      </>
    );
  },

  "tirage-horizontal/salle": () => (
    <>
      <Sol />
      <Banc x={52} y={104} longueur={38} />
      <Poulie x={198} yHaut={112} vers={[88, 96]} />
      <Silhouette pose={assis(72, 104, [88, 96])} depart={assis(72, 104, [114, 88])} />
      <Fleche de={[132, 80]} vers={[104, 88]} courbure={10} />
    </>
  ),

  "tirage-horizontal/maison": () => (
    <>
      <Sol />
      <Tapis x={100} demiLongueur={70} />
      <Elastique de={[128, 127]} vers={[88, 116]} />
      <Silhouette pose={assis(72, 124, [88, 116])} depart={assis(72, 124, [114, 108])} />
      <Fleche de={[132, 100]} vers={[104, 108]} courbure={10} />
    </>
  ),

  "face-pull/salle": () => (
    <>
      <Sol />
      <Barre x={112} y={20} rayon={6} />
      <Cable de={[112, 26]} vers={[142, 46]} />
      <Cable de={[112, 26]} vers={[82, 46]} />
      <Silhouette
        pose={deFace(112, [142, 46], [82, 46])}
        depart={deFace(112, [150, 76], [74, 76])}
      />
      <Fleche de={[164, 74]} vers={[152, 50]} courbure={-8} />
      <Fleche de={[60, 74]} vers={[72, 50]} courbure={8} />
    </>
  ),

  "face-pull/maison": () => (
    <>
      <Sol />
      <Barre x={112} y={22} rayon={5} />
      <Elastique de={[112, 28]} vers={[142, 46]} />
      <Elastique de={[112, 28]} vers={[82, 46]} />
      <Silhouette
        pose={deFace(112, [142, 46], [82, 46])}
        depart={deFace(112, [150, 76], [74, 76])}
      />
      <Fleche de={[164, 74]} vers={[152, 50]} courbure={-8} />
      <Fleche de={[60, 74]} vers={[72, 50]} courbure={8} />
    </>
  ),

  "biceps/salle": () => (
    <>
      <Sol />
      <Silhouette pose={debout(104, [128, 60])} depart={debout(104, [112, 86])} />
      <BarreDeFace x={128} y={60} demiLongueur={24} />
      <Fleche de={[156, 86]} vers={[156, 60]} courbure={8} />
    </>
  ),

  "biceps/maison": () => (
    <>
      <Sol />
      <Silhouette pose={debout(104, [128, 60])} depart={debout(104, [112, 86])} />
      <Elastique de={[122, 131]} vers={[132, 62]} />
      <Fleche de={[156, 86]} vers={[156, 60]} courbure={8} />
    </>
  ),

  "gainage-dos/salle": () => {
    const p = (cou: Point, tete: Point, epaule: Point, main: Point) =>
      poser({
        tete,
        cou,
        epaule,
        bassin: [100, 84],
        main,
        cheville: [150, 100],
        pied: [160, 104],
        coudeSens: 1,
        genouSens: 1,
      });
    return (
      <>
        <Sol />
        <Banc x={98} y={84} longueur={60} angle={-18} />
        <Barre x={152} y={94} rayon={7} />
        <Silhouette
          pose={p([67, 73], [55, 68], [70, 74], [64, 62])}
          depart={p([96, 118], [93, 130], [98, 117], [86, 110])}
        />
        <Fleche de={[46, 120]} vers={[40, 88]} courbure={10} />
      </>
    );
  },

  "gainage-dos/maison": () => (
    <>
      <Sol />
      <Tapis x={100} demiLongueur={74} />
      <Silhouette
        pose={poser({
          tete: [142, 108],
          cou: [130, 114],
          epaule: [126, 116],
          bassin: [94, 122],
          main: [158, 96],
          cheville: [46, 110],
          pied: [36, 106],
          coudeSens: 1,
          genouSens: -1,
        })}
      />
      <Fleche de={[172, 108]} vers={[170, 88]} courbure={5} />
      <Fleche de={[32, 122]} vers={[28, 102]} courbure={-5} />
    </>
  ),

  /* ----- Bas du corps -------------------------------------------------- */

  "squat/salle": () => (
    <>
      <Sol />
      <Silhouette pose={accroupi(112, [104, 64])} depart={debout(112, [104, 42])} />
      <BarreDeFace x={114} y={64} demiLongueur={30} />
      <Fleche de={[158, 100]} vers={[158, 66]} courbure={8} />
    </>
  ),

  "squat/maison": () => (
    <>
      <Sol />
      <Silhouette pose={accroupi(112, [128, 74])} depart={debout(112, [128, 52])} />
      <SacADos x={134} y={76} />
      <Fleche de={[164, 104]} vers={[164, 70]} courbure={8} />
    </>
  ),

  "fentes/salle": () => (
    <>
      <Sol />
      <Silhouette pose={fente(104, [116, 94])} />
      <Haltere x={118} y={96} vertical />
      <Fleche de={[162, 122]} vers={[194, 124]} courbure={-10} />
    </>
  ),

  "fentes/maison": () => (
    <>
      <Sol />
      <Silhouette pose={fente(104, [110, 76])} />
      <Fleche de={[162, 122]} vers={[194, 124]} courbure={-10} />
    </>
  ),

  "ischios/salle": () => (
    <>
      <Sol />
      <Silhouette pose={penche(104, [116, 100])} depart={debout(104, [112, 88])} />
      <BarreDeFace x={116} y={100} demiLongueur={28} />
      <Fleche de={[152, 106]} vers={[152, 76]} courbure={-8} />
    </>
  ),

  "ischios/maison": () => {
    const p = (cou: Point, tete: Point, epaule: Point, bassin: Point, cheville: Point) =>
      poser({
        tete,
        cou,
        epaule,
        bassin,
        main: [96, 118],
        cheville,
        pied: [160, 130],
        coudeSens: 1,
        genouSens: -1,
      });
    return (
      <>
        <Sol />
        <Banc x={30} y={94} longueur={48} />
        <Silhouette
          pose={p([76, 96], [64, 88], [72, 95], [110, 100], [148, 124])}
          depart={p([76, 102], [64, 94], [72, 101], [106, 120], [148, 124])}
        />
        <SacADos x={112} y={92} />
        <Fleche de={[130, 118]} vers={[130, 96]} courbure={6} />
      </>
    );
  },

  "mollets/salle": () => {
    /*
     * Le pied pivote autour de la pointe, restée au sol : c'est le seul point
     * fixe du mouvement. Tout le reste du corps monte donc du même écart,
     * sinon la jambe s'allongerait de dix pixels à chaque répétition.
     */
    const p = (dx: number, dy: number) =>
      poser({
        tete: [116 + dx, 20 + dy],
        cou: [113 + dx, 33 + dy],
        epaule: [112 + dx, 38 + dy],
        bassin: [110 + dx, 68 + dy],
        main: [124 + dx, 72 + dy],
        cheville: [111 + dx, 125 + dy],
        pied: [123, 131],
        coudeSens: 1,
        genouSens: -1,
      });
    return (
      <>
        <Sol />
        {/* Dessinés avant le corps : les coussins passeraient sinon en travers
            du buste, ce qui se lit comme une faute et non comme un plan. */}
        <BarreFixe x={112} y={42} />
        <Silhouette pose={p(11, -9)} depart={p(0, 0)} />
        <Fleche de={[154, 116]} vers={[154, 96]} courbure={5} />
      </>
    );
  },

  "mollets/maison": () => {
    // Même pivot ; la marche laisse au talon la place de descendre plus bas
    // que la pointe, ce qui double l'amplitude et rend le mouvement visible.
    const p = (dx: number, dy: number) =>
      poser({
        tete: [103 + dx, 26 + dy],
        cou: [100 + dx, 39 + dy],
        epaule: [99 + dx, 44 + dy],
        bassin: [97 + dx, 74 + dy],
        main: [111 + dx, 80 + dy],
        cheville: [99 + dx, 131 + dy],
        pied: [110, 126],
        coudeSens: 1,
        genouSens: -1,
      });
    return (
      <>
        <Sol />
        <Marche x={130} y={128} />
        <Silhouette pose={p(9, -16)} depart={p(0, 0)} />
        <Fleche de={[142, 122]} vers={[142, 98]} courbure={5} />
      </>
    );
  },

  /* ----- Sangle abdominale --------------------------------------------- */

  "abdos-circuit/salle": () => {
    const corps = (cheville: Point, pied: Point) =>
      poser({
        tete: [119, 54],
        cou: [120, 66],
        epaule: [120, 71],
        bassin: [118, 101],
        main: [133, 28],
        cheville,
        pied,
        coudeSens: 1,
        genouSens: -1,
      });
    return (
      <>
        {/* Pas de sol : suspendu, les pieds ne touchent rien, et un trait au
            bas du dessin ferait croire le contraire. */}
        <BarreFixe x={120} y={24} />
        <Silhouette pose={corps([164, 102], [174, 96])} depart={corps([110, 142], [100, 148])} />
        <Fleche de={[128, 138]} vers={[160, 112]} courbure={16} />
      </>
    );
  },

  "abdos-circuit/maison": () => {
    const corps = (cheville: Point, pied: Point) =>
      poser({
        tete: [56, 116],
        cou: [68, 121],
        epaule: [72, 122],
        bassin: [104, 126],
        main: [86, 131],
        cheville,
        pied,
        coudeSens: 1,
        genouSens: 1,
      });
    return (
      <>
        <Sol />
        <Tapis x={100} demiLongueur={74} />
        <Silhouette pose={corps([110, 70], [114, 60])} depart={corps([160, 126], [170, 122])} />
        <Fleche de={[152, 112]} vers={[124, 84]} courbure={16} />
      </>
    );
  },

  "core-final/salle": () => (
    <>
      <Sol />
      <Tapis x={76} demiLongueur={66} />
      <Silhouette pose={planche(58, 106, [124, 128], 1)} />
      <Axe de={[124, 88]} vers={[20, 124]} />
    </>
  ),

  "core-final/maison": () => (
    <>
      <Sol />
      <Tapis x={76} demiLongueur={66} />
      <Silhouette pose={planche(58, 106, [124, 128], 1)} />
      <Axe de={[124, 88]} vers={[20, 124]} />
    </>
  ),

  /* ----- Épaules et supersets ------------------------------------------ */

  "epaules-laterales/salle": () => (
    <>
      <Sol />
      <Silhouette
        pose={deFace(112, [154, 46], [70, 46])}
        depart={deFace(112, [126, 88], [98, 88])}
      />
      <Haltere x={154} y={46} />
      <Haltere x={70} y={46} />
      <Fleche de={[138, 86]} vers={[152, 60]} courbure={12} />
      <Fleche de={[86, 86]} vers={[72, 60]} courbure={-12} />
    </>
  ),

  "epaules-laterales/maison": () => (
    <>
      <Sol />
      <Elastique de={[121, 130]} vers={[152, 50]} />
      <Elastique de={[103, 130]} vers={[72, 50]} />
      <Silhouette
        pose={deFace(112, [154, 46], [70, 46])}
        depart={deFace(112, [126, 88], [98, 88])}
      />
      <Fleche de={[138, 86]} vers={[152, 60]} courbure={12} />
      <Fleche de={[86, 86]} vers={[72, 60]} courbure={-12} />
    </>
  ),

  "superset-pousse-tire/salle": () => (
    <>
      <Moitie x={-26}>
        <Sol />
        <Silhouette pose={debout(106, [112, 16])} depart={debout(106, [118, 46])} />
        <Haltere x={112} y={16} />
        <Fleche de={[142, 52]} vers={[142, 24]} courbure={5} />
      </Moitie>
      <Plus x={118} y={76} />
      <Moitie x={104}>
        <Sol />
        <Poulie x={186} yHaut={26} vers={[118, 68]} />
        <Silhouette pose={debout(96, [118, 68])} depart={debout(96, [126, 42])} />
        <Fleche de={[146, 46]} vers={[148, 74]} courbure={7} />
      </Moitie>
    </>
  ),

  "superset-pousse-tire/maison": () => (
    <>
      <Moitie x={-26}>
        <Sol />
        <Silhouette pose={planche(58, 86, [108, 130])} depart={planche(58, 104, [108, 130])} />
        <Fleche de={[148, 118]} vers={[148, 92]} courbure={5} />
      </Moitie>
      <Plus x={118} y={76} />
      <Moitie x={104}>
        <Sol />
        <Table x={178} y={78} demiLongueur={50} pieds="droit" />
        <Silhouette
          pose={poser({
            tete: [138, 86],
            cou: [126, 92],
            epaule: [129, 95],
            bassin: vers([126, 92], [42, 128], 35),
            main: [130, 80],
            cheville: [42, 128],
            pied: [32, 122],
            coudeSens: -1,
            genouSens: 1,
          })}
        />
        <Fleche de={[154, 118]} vers={[154, 94]} courbure={6} />
      </Moitie>
    </>
  ),

  "bras-superset/salle": () => (
    <>
      <Moitie x={-26}>
        <Sol />
        <Silhouette pose={debout(104, [128, 60])} depart={debout(104, [112, 86])} />
        <Haltere x={130} y={60} vertical />
        <Fleche de={[156, 86]} vers={[156, 60]} courbure={8} />
      </Moitie>
      <Plus x={118} y={76} />
      <Moitie x={104}>
        <Sol />
        <Poulie x={164} yHaut={26} vers={[116, 84]} />
        <Silhouette pose={debout(96, [116, 84])} depart={debout(96, [108, 58])} />
        <Fleche de={[136, 62]} vers={[138, 90]} courbure={7} />
      </Moitie>
    </>
  ),

  "bras-superset/maison": () => (
    <>
      <Moitie x={-26}>
        <Sol />
        <Silhouette pose={debout(104, [128, 60])} depart={debout(104, [112, 86])} />
        <Elastique de={[114, 131]} vers={[128, 62]} />
        <Fleche de={[156, 86]} vers={[156, 60]} courbure={8} />
      </Moitie>
      <Plus x={118} y={76} />
      <Moitie x={104}>
        <Sol />
        <Silhouette pose={planche(58, 86, [108, 130])} depart={planche(58, 104, [108, 130])} />
        <Fleche de={[148, 118]} vers={[148, 92]} courbure={5} />
      </Moitie>
    </>
  ),
};
