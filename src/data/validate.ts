/**
 * Validação da base de dados. Executada no carregamento (modo dev) e por
 * `npm run validate:data`. Retorna a lista de problemas encontrados.
 */
import { ELEMENTS, PLACEHOLDERS } from './elements';
import { BUTTON_GROUPS, buttonGroupOf } from '../config/buttonGroups';

const CORE: Record<string, number> = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
const SUBSHELL_MAX: Record<string, number> = { s: 2, p: 6, d: 10, f: 14 };

export function electronCount(config: string): number {
  let total = 0;
  const core = config.match(/^\[([A-Za-z]+)\]/);
  if (core) total += CORE[core[1]] ?? NaN;
  for (const m of config.matchAll(/(\d)([spdf])(\d+)/g)) {
    const n = Number(m[3]);
    if (n > SUBSHELL_MAX[m[2]]) return NaN;
    total += n;
  }
  return total;
}

export function validateElements(): string[] {
  const errors: string[] = [];
  if (ELEMENTS.length !== 118) errors.push(`Esperados 118 elementos, encontrados ${ELEMENTS.length}`);
  const symbols = new Set<string>();
  const cells = new Set<string>();
  ELEMENTS.forEach((e, i) => {
    if (e.number !== i + 1) errors.push(`Ordem incorreta: posição ${i + 1} contém Z=${e.number}`);
    if (symbols.has(e.symbol)) errors.push(`Símbolo duplicado: ${e.symbol}`);
    symbols.add(e.symbol);
    const key = `${e.col},${e.row}`;
    if (cells.has(key)) errors.push(`Posição duplicada ${key} (${e.symbol})`);
    cells.add(key);
    const ec = electronCount(e.config);
    if (ec !== e.number) errors.push(`${e.symbol}: configuração "${e.config}" soma ${ec} elétrons (esperado ${e.number})`);
    if (!/^[A-Z][a-z]?$/.test(e.symbol)) errors.push(`Símbolo inválido: ${e.symbol}`);
    if (!e.name || !e.description) errors.push(`${e.symbol}: nome ou descrição ausente`);
    if (Number.isNaN(Number(e.mass))) errors.push(`${e.symbol}: massa inválida`);
    if (e.col < 1 || e.col > 18 || e.row < 1 || e.row > 9) errors.push(`${e.symbol}: posição fora da grade`);
    if (e.row <= 7 && e.row !== e.period) errors.push(`${e.symbol}: linha ${e.row} ≠ período ${e.period}`);
    if (e.group !== null && e.col !== e.group) errors.push(`${e.symbol}: coluna ${e.col} ≠ grupo ${e.group}`);
  });
  // Massas devem crescer com Z, exceto pares conhecidos (Ar/K, Co/Ni, Te/I, Th/Pa, U/Np, Pu/Am...)
  const knownInversions = new Set([19, 28, 53, 91, 93, 95, 97, 108, 118]);
  for (let i = 1; i < ELEMENTS.length; i++) {
    const a = Number(ELEMENTS[i - 1].mass), b = Number(ELEMENTS[i].mass);
    if (b < a && !knownInversions.has(ELEMENTS[i].number)) errors.push(`Massa decrescente inesperada em ${ELEMENTS[i].symbol}`);
  }
  for (const p of PLACEHOLDERS) if (cells.has(`${p.col},${p.row}`)) errors.push(`Marcador ${p.label} sobrepõe um elemento`);
  const groupIds = new Set(BUTTON_GROUPS.map((g) => g.id));
  for (const e of ELEMENTS) if (!groupIds.has(buttonGroupOf(e.number))) errors.push(`${e.symbol} sem grupo de botão`);
  return errors;
}
