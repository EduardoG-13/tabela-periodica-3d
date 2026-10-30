import type { ChemicalElement } from '../data/elements';

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** "[Ne] 3s2 3p1" → "[Ne] 3s² 3p¹" */
export function configPretty(config: string): string {
  return config.replace(/([spdf])(\d+)/g, (_, l: string, n: string) => l + n.split('').map((c) => SUP[c]).join(''));
}

/** Parte de valência (sem o cerne de gás nobre), como gravado nas placas: "3s²3p¹" */
export function configValence(config: string): string {
  return configPretty(config.replace(/^\[[A-Za-z]+\]\s*/, '')).replace(/\s+/g, '');
}

/** Tokens para desenhar com sobrescritos reais no canvas */
export function configTokens(config: string): { base: string; sup: string }[] {
  const v = config.replace(/^\[[A-Za-z]+\]\s*/, '');
  return v.split(/\s+/).map((t) => {
    const m = t.match(/^(\d[spdf])(\d+)$/);
    return m ? { base: m[1], sup: m[2] } : { base: t, sup: '' };
  });
}

/** Massa no formato brasileiro (vírgula decimal); números de massa entre colchetes */
export function massLabel(el: ChemicalElement): string {
  const s = el.mass.replace('.', ',');
  return el.massKind === 'mn' ? `[${s}]` : s;
}

export function massLong(el: ChemicalElement): string {
  return el.massKind === 'mn'
    ? `[${el.mass}] — número de massa do isótopo de referência (sem massa atômica padrão)`
    : `${el.mass.replace('.', ',')} u`;
}

export const kToC = (k: number) => (k - 273.15).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
export const num = (v: number, d = 3) => v.toLocaleString('pt-BR', { maximumFractionDigits: d });
