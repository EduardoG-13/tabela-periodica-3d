/**
 * Leiaute da instalação na parede (metros). Parede no plano z = 0, piso em y = 0.
 * Passos dos nichos estimados a partir das proporções da fotografia (ver construction.ts).
 */
import { NICHE, BOX, MM } from '../data/construction';
import { ELEMENTS, PLACEHOLDERS } from '../data/elements';

export const PITCH_X = NICHE.pitchX * MM;
export const PITCH_Y = NICHE.pitchY * MM;
export const NICHE_DEPTH = NICHE.depth * MM;
export const WALL_T = NICHE.wall * MM;
export const STANDOFF = NICHE.wallStandoff * MM;

const ROW9_BOTTOM = NICHE.bottomClearance * MM;

/** Base (piso interno) e centro do nicho */
export function cellOrigin(col: number, row: number): { x: number; y: number } {
  const x = (col - 9.5) * PITCH_X;
  let bottom: number;
  if (row === 9) bottom = ROW9_BOTTOM;
  else if (row === 8) bottom = ROW9_BOTTOM + PITCH_Y;
  else bottom = ROW9_BOTTOM + 2 * PITCH_Y + NICHE.fBlockGap * MM + (7 - row) * PITCH_Y;
  return { x, y: bottom };
}

/** z da face traseira do nicho e da frente */
export const NICHE_BACK_Z = STANDOFF;
export const NICHE_FRONT_Z = STANDOFF + WALL_T + NICHE_DEPTH;

/** Posição do módulo (origem = centro da base da caixa) dentro do nicho */
export function modulePosition(col: number, row: number): [number, number, number] {
  const o = cellOrigin(col, row);
  const z = NICHE_FRONT_Z - 0.006 - (BOX.depth * MM) / 2;
  return [o.x, o.y + WALL_T, z];
}

export const TABLE_LEFT = cellOrigin(1, 1).x - PITCH_X / 2;
export const TABLE_RIGHT = cellOrigin(18, 1).x + PITCH_X / 2;
export const TABLE_TOP = cellOrigin(1, 1).y + PITCH_Y;
export const TABLE_BOTTOM = ROW9_BOTTOM;
export const TABLE_CENTER: [number, number, number] = [0, (TABLE_TOP + TABLE_BOTTOM) / 2, NICHE_FRONT_Z];

export interface Slot {
  index: number;
  z: number | null; // número atômico, ou null para marcador
  col: number;
  row: number;
  label?: string;
}

/** Todos os nichos: 118 elementos (índices 0–117) + 2 marcadores das séries f */
export const SLOTS: Slot[] = [
  ...ELEMENTS.map((e, i) => ({ index: i, z: e.number, col: e.col, row: e.row })),
  ...PLACEHOLDERS.map((p, i) => ({ index: 118 + i, z: null, col: p.col, row: p.row, label: p.label })),
];

const byCell = new Map<string, number>();
for (const e of ELEMENTS) byCell.set(`${e.col},${e.row}`, e.number);
export const elementAt = (col: number, row: number) => byCell.get(`${col},${row}`);

/** Navegação espacial por teclado entre elementos */
export function neighbor(z: number, dir: 'left' | 'right' | 'up' | 'down'): number {
  const e = ELEMENTS[z - 1];
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (dir === 'left' || dir === 'right') {
    const step = dir === 'left' ? -1 : 1;
    for (let c = e.col + step; c >= 1 && c <= 18; c += step) {
      const n = elementAt(c, e.row);
      if (n) return n;
    }
    return z;
  }
  const step = dir === 'up' ? -1 : 1;
  for (let ri = rows.indexOf(e.row) + step; ri >= 0 && ri < rows.length; ri += step) {
    const r = rows[ri];
    let best: number | undefined;
    for (let d = 0; d < 18 && !best; d++) best = elementAt(e.col - d, r) ?? elementAt(e.col + d, r);
    if (best) return best;
  }
  return z;
}

/**
 * Itens à esquerda da tabela — ESTIMADOS a partir da foto de detalhe
 * (image(20261030-114314).png), com escala tirada da placa de acrílico do Na
 * (120 mm visíveis ≈ 170 px → ≈ 1,45 px/mm):
 *  - vão entre a placa informativa e a coluna 1 ≈ 215 mm;
 *  - plaquinha de créditos ≈ 105 × 190 mm, centralizada sobre a caixa de botões, ≈ 85 mm acima dela;
 *  - caixa de botões ≈ 248 mm × 71 mm (frente) × 65 mm (profundidade), ocupando todo o vão e
 *    avançando ≈ 15 mm sobre a placa e sobre a coluna 1; base ≈ 20 mm abaixo da base do período 4.
 */
const GAP = 0.215;
const BTN_BOTTOM = cellOrigin(1, 4).y - 0.02;
export const BUTTON_BOX = { x: TABLE_LEFT - GAP / 2, y: BTN_BOTTOM + 0.0355, w: 0.248, h: 0.071, d: 0.065 };
// A placa fica 5 mm à esquerda da caixa de botões. Com os ≈15 mm de sobreposição estimados,
// a caixa (65 mm de profundidade) cobria o canto da placa e o QR de Gases Nobres; no objeto real
// os QR Codes precisam ficar livres. Diferença de ≈21 mm, dentro da margem da estimativa por foto.
const BOARD_W = 0.84;
export const BOARD = { x: BUTTON_BOX.x - BUTTON_BOX.w / 2 - 0.005 - BOARD_W / 2, y: 1.5, w: BOARD_W, h: 0.73 };
export const CREDITS = { x: BUTTON_BOX.x, y: BUTTON_BOX.y + BUTTON_BOX.h / 2 + 0.085 + 0.095, w: 0.105, h: 0.19 };

/**
 * Caixa técnica (caixa_arduino.svg). O painel de 293,1 × 183,1 mm tem as mesmas proporções do volume
 * branco que aparece à direita do Rn na foto da instalação (≈ 85 × 55 px com nicho de 57 px ≈ 190 mm
 * → ≈ 283 × 183 mm). Por isso a caixa é posicionada ali — correspondência ESTIMADA, não documentada.
 * x/y = centro da face visível; d = profundidade (paredes de 123,2 mm do SVG).
 */
export const ELECTRONICS_BOX = { x: TABLE_RIGHT + 0.1466 + 0.005, y: cellOrigin(18, 6).y + PITCH_Y / 2 - 0.01, w: 0.2931, h: 0.1831, d: 0.1232 };
