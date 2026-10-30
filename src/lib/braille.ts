/**
 * Transcrição braile grau 1 conforme a Grafia Braille para a Língua Portuguesa
 * (letras, acentos, sinal de maiúscula ⠨ = pontos 4-6 e sinal de número ⠼ = 3-4-5-6).
 * Cada cela é representada pelos números dos pontos levantados (1–6):
 *   1 ● ● 4
 *   2 ● ● 5
 *   3 ● ● 6
 */
const LETTERS: Record<string, number[]> = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
  k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5], p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5],
  u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
  á: [1, 2, 3, 5, 6], é: [1, 2, 3, 4, 5, 6], í: [3, 4], ó: [3, 4, 6], ú: [2, 3, 4, 5, 6],
  â: [1, 6], ê: [1, 2, 6], ô: [1, 4, 5, 6], à: [1, 2, 4, 6], ã: [3, 4, 5], õ: [2, 4, 6], ç: [1, 2, 3, 4, 6], ü: [1, 2, 5, 6],
};
const DIGIT_LETTER: Record<string, string> = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e', '6': 'f', '7': 'g', '8': 'h', '9': 'i', '0': 'j' };
const PUNCT: Record<string, number[]> = { ',': [2], '.': [3], '-': [3, 6], ':': [2, 5], ';': [2, 3], '?': [2, 6], '!': [2, 3, 5] };
const CAPITAL = [4, 6];
const NUMBER = [3, 4, 5, 6];

/** Cela vazia (espaço) é representada por [] */
export type Cell = number[];

export function toBrailleCells(text: string): Cell[] {
  const cells: Cell[] = [];
  let inNumber = false;
  for (const raw of text) {
    if (raw === ' ') { cells.push([]); inNumber = false; continue; }
    if (/[0-9]/.test(raw)) {
      if (!inNumber) cells.push(NUMBER);
      inNumber = true;
      cells.push(LETTERS[DIGIT_LETTER[raw]]);
      continue;
    }
    if (raw === ',' && inNumber) { cells.push(PUNCT[',']); continue; }
    inNumber = false;
    const lower = raw.toLocaleLowerCase('pt-BR');
    if (LETTERS[lower]) {
      if (lower !== raw) cells.push(CAPITAL);
      cells.push(LETTERS[lower]);
    } else if (PUNCT[raw]) cells.push(PUNCT[raw]);
  }
  return cells;
}

/** Converte para caracteres Unicode braile (U+2800), útil para leitores e para conferência visual. */
export function toBrailleUnicode(text: string): string {
  return toBrailleCells(text)
    .map((c) => String.fromCodePoint(0x2800 + c.reduce((acc, d) => acc | (1 << (d - 1)), 0)))
    .join('');
}

/**
 * Posições dos pontos em milímetros, com origem no canto superior esquerdo do texto.
 * Medidas padrão: distância entre pontos 2,5 mm, entre celas 6 mm, diâmetro ≈ 1,5 mm.
 */
export function brailleDotPositions(text: string, dotPitch = 2.5, cellPitch = 6): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  toBrailleCells(text).forEach((cell, i) => {
    for (const d of cell) {
      const col = d <= 3 ? 0 : 1;
      const row = (d - 1) % 3;
      out.push({ x: i * cellPitch + col * dotPitch, y: row * dotPitch });
    }
  });
  return out;
}

export function brailleWidth(text: string, dotPitch = 2.5, cellPitch = 6): number {
  const n = toBrailleCells(text).length;
  return n === 0 ? 0 : (n - 1) * cellPitch + dotPitch;
}
