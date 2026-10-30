/**
 * Base de dados central dos 118 elementos químicos.
 *
 * Fonte única de verdade: todos os componentes (cena 3D, tabela plana, painéis,
 * busca, braile, LEDs) derivam suas informações daqui. A validação automática
 * (src/data/validate.ts, `npm run validate:data`) confere contagem, unicidade,
 * posições e se a configuração eletrônica soma exatamente Z elétrons.
 *
 * Massas: valores abreviados de massa atômica padrão da IUPAC/CIAAW (5 algarismos
 * significativos). Para elementos sem massa atômica padrão, `massKind: 'mn'`
 * indica o número de massa do isótopo de referência (mais longevo conhecido),
 * exibido entre colchetes, por convenção.
 */
import { DETAILS } from './elementDetails';
import { PHYSICAL_PROPS, type PhysicalProps } from './physicalProps.generated';

export type CategoryId =
  | 'nao-metal'
  | 'gas-nobre'
  | 'alcalino'
  | 'alcalinoterroso'
  | 'transicao'
  | 'pos-transicao'
  | 'semimetal'
  | 'halogenio'
  | 'lantanideo'
  | 'actinideo'
  | 'desconhecido';

/** s = sólido, l = líquido, g = gasoso, p = sólido presumido (nunca obtido em quantidade visível), u = desconhecido */
export type StateCode = 's' | 'l' | 'g' | 'p' | 'u';

type Row = [number, string, string, string, 'std' | 'mn', string, CategoryId, StateCode];

// prettier-ignore
const ROWS: Row[] = [
  [1, 'H', 'Hidrogênio', '1.008', 'std', '1s1', 'nao-metal', 'g'],
  [2, 'He', 'Hélio', '4.0026', 'std', '1s2', 'gas-nobre', 'g'],
  [3, 'Li', 'Lítio', '6.94', 'std', '[He] 2s1', 'alcalino', 's'],
  [4, 'Be', 'Berílio', '9.0122', 'std', '[He] 2s2', 'alcalinoterroso', 's'],
  [5, 'B', 'Boro', '10.81', 'std', '[He] 2s2 2p1', 'semimetal', 's'],
  [6, 'C', 'Carbono', '12.011', 'std', '[He] 2s2 2p2', 'nao-metal', 's'],
  [7, 'N', 'Nitrogênio', '14.007', 'std', '[He] 2s2 2p3', 'nao-metal', 'g'],
  [8, 'O', 'Oxigênio', '15.999', 'std', '[He] 2s2 2p4', 'nao-metal', 'g'],
  [9, 'F', 'Flúor', '18.998', 'std', '[He] 2s2 2p5', 'halogenio', 'g'],
  [10, 'Ne', 'Neônio', '20.180', 'std', '[He] 2s2 2p6', 'gas-nobre', 'g'],
  [11, 'Na', 'Sódio', '22.990', 'std', '[Ne] 3s1', 'alcalino', 's'],
  [12, 'Mg', 'Magnésio', '24.305', 'std', '[Ne] 3s2', 'alcalinoterroso', 's'],
  [13, 'Al', 'Alumínio', '26.982', 'std', '[Ne] 3s2 3p1', 'pos-transicao', 's'],
  [14, 'Si', 'Silício', '28.085', 'std', '[Ne] 3s2 3p2', 'semimetal', 's'],
  [15, 'P', 'Fósforo', '30.974', 'std', '[Ne] 3s2 3p3', 'nao-metal', 's'],
  [16, 'S', 'Enxofre', '32.06', 'std', '[Ne] 3s2 3p4', 'nao-metal', 's'],
  [17, 'Cl', 'Cloro', '35.45', 'std', '[Ne] 3s2 3p5', 'halogenio', 'g'],
  [18, 'Ar', 'Argônio', '39.95', 'std', '[Ne] 3s2 3p6', 'gas-nobre', 'g'],
  [19, 'K', 'Potássio', '39.098', 'std', '[Ar] 4s1', 'alcalino', 's'],
  [20, 'Ca', 'Cálcio', '40.078', 'std', '[Ar] 4s2', 'alcalinoterroso', 's'],
  [21, 'Sc', 'Escândio', '44.956', 'std', '[Ar] 3d1 4s2', 'transicao', 's'],
  [22, 'Ti', 'Titânio', '47.867', 'std', '[Ar] 3d2 4s2', 'transicao', 's'],
  [23, 'V', 'Vanádio', '50.942', 'std', '[Ar] 3d3 4s2', 'transicao', 's'],
  [24, 'Cr', 'Cromo', '51.996', 'std', '[Ar] 3d5 4s1', 'transicao', 's'],
  [25, 'Mn', 'Manganês', '54.938', 'std', '[Ar] 3d5 4s2', 'transicao', 's'],
  [26, 'Fe', 'Ferro', '55.845', 'std', '[Ar] 3d6 4s2', 'transicao', 's'],
  [27, 'Co', 'Cobalto', '58.933', 'std', '[Ar] 3d7 4s2', 'transicao', 's'],
  [28, 'Ni', 'Níquel', '58.693', 'std', '[Ar] 3d8 4s2', 'transicao', 's'],
  [29, 'Cu', 'Cobre', '63.546', 'std', '[Ar] 3d10 4s1', 'transicao', 's'],
  [30, 'Zn', 'Zinco', '65.38', 'std', '[Ar] 3d10 4s2', 'transicao', 's'],
  [31, 'Ga', 'Gálio', '69.723', 'std', '[Ar] 3d10 4s2 4p1', 'pos-transicao', 's'],
  [32, 'Ge', 'Germânio', '72.630', 'std', '[Ar] 3d10 4s2 4p2', 'semimetal', 's'],
  [33, 'As', 'Arsênio', '74.922', 'std', '[Ar] 3d10 4s2 4p3', 'semimetal', 's'],
  [34, 'Se', 'Selênio', '78.971', 'std', '[Ar] 3d10 4s2 4p4', 'nao-metal', 's'],
  [35, 'Br', 'Bromo', '79.904', 'std', '[Ar] 3d10 4s2 4p5', 'halogenio', 'l'],
  [36, 'Kr', 'Criptônio', '83.798', 'std', '[Ar] 3d10 4s2 4p6', 'gas-nobre', 'g'],
  [37, 'Rb', 'Rubídio', '85.468', 'std', '[Kr] 5s1', 'alcalino', 's'],
  [38, 'Sr', 'Estrôncio', '87.62', 'std', '[Kr] 5s2', 'alcalinoterroso', 's'],
  [39, 'Y', 'Ítrio', '88.906', 'std', '[Kr] 4d1 5s2', 'transicao', 's'],
  [40, 'Zr', 'Zircônio', '91.222', 'std', '[Kr] 4d2 5s2', 'transicao', 's'],
  [41, 'Nb', 'Nióbio', '92.906', 'std', '[Kr] 4d4 5s1', 'transicao', 's'],
  [42, 'Mo', 'Molibdênio', '95.95', 'std', '[Kr] 4d5 5s1', 'transicao', 's'],
  [43, 'Tc', 'Tecnécio', '97', 'mn', '[Kr] 4d5 5s2', 'transicao', 's'],
  [44, 'Ru', 'Rutênio', '101.07', 'std', '[Kr] 4d7 5s1', 'transicao', 's'],
  [45, 'Rh', 'Ródio', '102.91', 'std', '[Kr] 4d8 5s1', 'transicao', 's'],
  [46, 'Pd', 'Paládio', '106.42', 'std', '[Kr] 4d10', 'transicao', 's'],
  [47, 'Ag', 'Prata', '107.87', 'std', '[Kr] 4d10 5s1', 'transicao', 's'],
  [48, 'Cd', 'Cádmio', '112.41', 'std', '[Kr] 4d10 5s2', 'transicao', 's'],
  [49, 'In', 'Índio', '114.82', 'std', '[Kr] 4d10 5s2 5p1', 'pos-transicao', 's'],
  [50, 'Sn', 'Estanho', '118.71', 'std', '[Kr] 4d10 5s2 5p2', 'pos-transicao', 's'],
  [51, 'Sb', 'Antimônio', '121.76', 'std', '[Kr] 4d10 5s2 5p3', 'semimetal', 's'],
  [52, 'Te', 'Telúrio', '127.60', 'std', '[Kr] 4d10 5s2 5p4', 'semimetal', 's'],
  [53, 'I', 'Iodo', '126.90', 'std', '[Kr] 4d10 5s2 5p5', 'halogenio', 's'],
  [54, 'Xe', 'Xenônio', '131.29', 'std', '[Kr] 4d10 5s2 5p6', 'gas-nobre', 'g'],
  [55, 'Cs', 'Césio', '132.91', 'std', '[Xe] 6s1', 'alcalino', 's'],
  [56, 'Ba', 'Bário', '137.33', 'std', '[Xe] 6s2', 'alcalinoterroso', 's'],
  [57, 'La', 'Lantânio', '138.91', 'std', '[Xe] 5d1 6s2', 'lantanideo', 's'],
  [58, 'Ce', 'Cério', '140.12', 'std', '[Xe] 4f1 5d1 6s2', 'lantanideo', 's'],
  [59, 'Pr', 'Praseodímio', '140.91', 'std', '[Xe] 4f3 6s2', 'lantanideo', 's'],
  [60, 'Nd', 'Neodímio', '144.24', 'std', '[Xe] 4f4 6s2', 'lantanideo', 's'],
  [61, 'Pm', 'Promécio', '145', 'mn', '[Xe] 4f5 6s2', 'lantanideo', 's'],
  [62, 'Sm', 'Samário', '150.36', 'std', '[Xe] 4f6 6s2', 'lantanideo', 's'],
  [63, 'Eu', 'Európio', '151.96', 'std', '[Xe] 4f7 6s2', 'lantanideo', 's'],
  [64, 'Gd', 'Gadolínio', '157.25', 'std', '[Xe] 4f7 5d1 6s2', 'lantanideo', 's'],
  [65, 'Tb', 'Térbio', '158.93', 'std', '[Xe] 4f9 6s2', 'lantanideo', 's'],
  [66, 'Dy', 'Disprósio', '162.50', 'std', '[Xe] 4f10 6s2', 'lantanideo', 's'],
  [67, 'Ho', 'Hólmio', '164.93', 'std', '[Xe] 4f11 6s2', 'lantanideo', 's'],
  [68, 'Er', 'Érbio', '167.26', 'std', '[Xe] 4f12 6s2', 'lantanideo', 's'],
  [69, 'Tm', 'Túlio', '168.93', 'std', '[Xe] 4f13 6s2', 'lantanideo', 's'],
  [70, 'Yb', 'Itérbio', '173.05', 'std', '[Xe] 4f14 6s2', 'lantanideo', 's'],
  [71, 'Lu', 'Lutécio', '174.97', 'std', '[Xe] 4f14 5d1 6s2', 'lantanideo', 's'],
  [72, 'Hf', 'Háfnio', '178.49', 'std', '[Xe] 4f14 5d2 6s2', 'transicao', 's'],
  [73, 'Ta', 'Tântalo', '180.95', 'std', '[Xe] 4f14 5d3 6s2', 'transicao', 's'],
  [74, 'W', 'Tungstênio', '183.84', 'std', '[Xe] 4f14 5d4 6s2', 'transicao', 's'],
  [75, 'Re', 'Rênio', '186.21', 'std', '[Xe] 4f14 5d5 6s2', 'transicao', 's'],
  [76, 'Os', 'Ósmio', '190.23', 'std', '[Xe] 4f14 5d6 6s2', 'transicao', 's'],
  [77, 'Ir', 'Irídio', '192.22', 'std', '[Xe] 4f14 5d7 6s2', 'transicao', 's'],
  [78, 'Pt', 'Platina', '195.08', 'std', '[Xe] 4f14 5d9 6s1', 'transicao', 's'],
  [79, 'Au', 'Ouro', '196.97', 'std', '[Xe] 4f14 5d10 6s1', 'transicao', 's'],
  [80, 'Hg', 'Mercúrio', '200.59', 'std', '[Xe] 4f14 5d10 6s2', 'transicao', 'l'],
  [81, 'Tl', 'Tálio', '204.38', 'std', '[Xe] 4f14 5d10 6s2 6p1', 'pos-transicao', 's'],
  [82, 'Pb', 'Chumbo', '207.2', 'std', '[Xe] 4f14 5d10 6s2 6p2', 'pos-transicao', 's'],
  [83, 'Bi', 'Bismuto', '208.98', 'std', '[Xe] 4f14 5d10 6s2 6p3', 'pos-transicao', 's'],
  [84, 'Po', 'Polônio', '209', 'mn', '[Xe] 4f14 5d10 6s2 6p4', 'pos-transicao', 's'],
  [85, 'At', 'Astato', '210', 'mn', '[Xe] 4f14 5d10 6s2 6p5', 'halogenio', 'p'],
  [86, 'Rn', 'Radônio', '222', 'mn', '[Xe] 4f14 5d10 6s2 6p6', 'gas-nobre', 'g'],
  [87, 'Fr', 'Frâncio', '223', 'mn', '[Rn] 7s1', 'alcalino', 'p'],
  [88, 'Ra', 'Rádio', '226', 'mn', '[Rn] 7s2', 'alcalinoterroso', 's'],
  [89, 'Ac', 'Actínio', '227', 'mn', '[Rn] 6d1 7s2', 'actinideo', 's'],
  [90, 'Th', 'Tório', '232.04', 'std', '[Rn] 6d2 7s2', 'actinideo', 's'],
  [91, 'Pa', 'Protactínio', '231.04', 'std', '[Rn] 5f2 6d1 7s2', 'actinideo', 's'],
  [92, 'U', 'Urânio', '238.03', 'std', '[Rn] 5f3 6d1 7s2', 'actinideo', 's'],
  [93, 'Np', 'Netúnio', '237', 'mn', '[Rn] 5f4 6d1 7s2', 'actinideo', 's'],
  [94, 'Pu', 'Plutônio', '244', 'mn', '[Rn] 5f6 7s2', 'actinideo', 's'],
  [95, 'Am', 'Amerício', '243', 'mn', '[Rn] 5f7 7s2', 'actinideo', 's'],
  [96, 'Cm', 'Cúrio', '247', 'mn', '[Rn] 5f7 6d1 7s2', 'actinideo', 's'],
  [97, 'Bk', 'Berquélio', '247', 'mn', '[Rn] 5f9 7s2', 'actinideo', 's'],
  [98, 'Cf', 'Califórnio', '251', 'mn', '[Rn] 5f10 7s2', 'actinideo', 's'],
  [99, 'Es', 'Einstênio', '252', 'mn', '[Rn] 5f11 7s2', 'actinideo', 's'],
  [100, 'Fm', 'Férmio', '257', 'mn', '[Rn] 5f12 7s2', 'actinideo', 'u'],
  [101, 'Md', 'Mendelévio', '258', 'mn', '[Rn] 5f13 7s2', 'actinideo', 'u'],
  [102, 'No', 'Nobélio', '259', 'mn', '[Rn] 5f14 7s2', 'actinideo', 'u'],
  [103, 'Lr', 'Laurêncio', '266', 'mn', '[Rn] 5f14 7s2 7p1', 'actinideo', 'u'],
  [104, 'Rf', 'Rutherfórdio', '267', 'mn', '[Rn] 5f14 6d2 7s2', 'transicao', 'u'],
  [105, 'Db', 'Dúbnio', '268', 'mn', '[Rn] 5f14 6d3 7s2', 'transicao', 'u'],
  [106, 'Sg', 'Seabórgio', '269', 'mn', '[Rn] 5f14 6d4 7s2', 'transicao', 'u'],
  [107, 'Bh', 'Bóhrio', '270', 'mn', '[Rn] 5f14 6d5 7s2', 'transicao', 'u'],
  [108, 'Hs', 'Hássio', '269', 'mn', '[Rn] 5f14 6d6 7s2', 'transicao', 'u'],
  [109, 'Mt', 'Meitnério', '278', 'mn', '[Rn] 5f14 6d7 7s2', 'desconhecido', 'u'],
  [110, 'Ds', 'Darmstádtio', '281', 'mn', '[Rn] 5f14 6d8 7s2', 'desconhecido', 'u'],
  [111, 'Rg', 'Roentgênio', '282', 'mn', '[Rn] 5f14 6d9 7s2', 'desconhecido', 'u'],
  [112, 'Cn', 'Copernício', '285', 'mn', '[Rn] 5f14 6d10 7s2', 'desconhecido', 'u'],
  [113, 'Nh', 'Nihônio', '286', 'mn', '[Rn] 5f14 6d10 7s2 7p1', 'desconhecido', 'u'],
  [114, 'Fl', 'Fleróvio', '289', 'mn', '[Rn] 5f14 6d10 7s2 7p2', 'desconhecido', 'u'],
  [115, 'Mc', 'Moscóvio', '290', 'mn', '[Rn] 5f14 6d10 7s2 7p3', 'desconhecido', 'u'],
  [116, 'Lv', 'Livermório', '293', 'mn', '[Rn] 5f14 6d10 7s2 7p4', 'desconhecido', 'u'],
  [117, 'Ts', 'Tenesso', '294', 'mn', '[Rn] 5f14 6d10 7s2 7p5', 'desconhecido', 'u'],
  [118, 'Og', 'Oganessônio', '294', 'mn', '[Rn] 5f14 6d10 7s2 7p6', 'desconhecido', 'u'],
];

/** Categoria prevista para os superpesados cuja química ainda não foi caracterizada. */
export const PREDICTED_CATEGORY: Partial<Record<number, string>> = {
  109: 'provável metal de transição', 110: 'provável metal de transição', 111: 'provável metal de transição',
  112: 'provável metal de transição (volátil)', 113: 'provável metal pós-transição', 114: 'provável metal pós-transição (volátil)',
  115: 'provável metal pós-transição', 116: 'provável metal pós-transição', 117: 'provável halogênio / semimetal',
  118: 'provável gás nobre (previsto sólido)',
};

export type Block = 's' | 'p' | 'd' | 'f';

export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  /** Massa como string com ponto decimal (fonte), ex.: "26.982" */
  mass: string;
  massKind: 'std' | 'mn';
  config: string;
  /** Configuração eletrônica prevista (não confirmada experimentalmente) */
  configPredicted: boolean;
  category: CategoryId;
  predictedCategory?: string;
  state: StateCode;
  period: number;
  /** 1–18; null para lantanídeos e actinídeos (séries f) */
  group: number | null;
  block: Block;
  /** Coluna (1–18) e linha (1–7 = períodos, 8 = lantanídeos, 9 = actinídeos) na instalação */
  col: number;
  row: number;
  discoveryYear: string;
  discoverer: string;
  description: string;
  uses: string;
  curiosity: string;
  safety?: string;
  physical: PhysicalProps;
}

const PERIOD_BOUNDS = [2, 10, 18, 36, 54, 86, 118];

export function periodOf(z: number): number {
  return PERIOD_BOUNDS.findIndex((b) => z <= b) + 1;
}

/** Grupo IUPAC (1–18) calculado a partir de Z; null para as séries f. */
export function groupOf(z: number): number | null {
  if (z === 1) return 1;
  if (z === 2) return 18;
  if ((z >= 57 && z <= 71) || (z >= 89 && z <= 103)) return null;
  const p = periodOf(z);
  const start = [0, 1, 3, 11, 19, 37, 55, 87][p];
  let offset = z - start; // 0-based dentro do período
  if (p <= 3) return offset < 2 ? offset + 1 : offset + 11; // períodos curtos
  if (p >= 6) offset = offset >= 17 ? offset - 14 : offset; // retira as 14 posições das séries f (La..Lu ocupa a posição do grupo 3)
  return offset + 1;
}

function blockOf(z: number, group: number | null): Block {
  if (group === null) return 'f';
  if (z === 2) return 's';
  if (group <= 2) return 's';
  if (group >= 13) return 'p';
  return 'd';
}

export const ELEMENTS: ChemicalElement[] = ROWS.map(([number, symbol, name, mass, massKind, config, category, state]) => {
  const period = periodOf(number);
  const group = groupOf(number);
  const isLa = number >= 57 && number <= 71;
  const isAc = number >= 89 && number <= 103;
  // Na instalação (foto 1) as séries f começam na coluna 4 e vão até a 18 (15 elementos).
  const col = isLa ? number - 57 + 4 : isAc ? number - 89 + 4 : (group as number);
  const row = isLa ? 8 : isAc ? 9 : period;
  const d = DETAILS[number];
  if (!d) throw new Error(`Detalhes ausentes para Z=${number}`);
  return {
    number, symbol, name, mass, massKind, config,
    configPredicted: number >= 104,
    category, predictedCategory: PREDICTED_CATEGORY[number], state, period, group,
    block: blockOf(number, group), col, row,
    discoveryYear: d[0], discoverer: d[1], description: d[2], uses: d[3], curiosity: d[4], safety: d[5],
    physical: PHYSICAL_PROPS[number],
  };
});

export const ELEMENT_BY_Z = new Map(ELEMENTS.map((e) => [e.number, e]));
export const getElement = (z: number) => ELEMENT_BY_Z.get(z)!;

/** Nichos especiais da instalação (sem elemento): marcadores das séries f na coluna 3 */
export const PLACEHOLDERS = [
  { id: 'la-series', label: '57 - 71', col: 3, row: 6, target: 8 },
  { id: 'ac-series', label: '89 - 103', col: 3, row: 7, target: 9 },
] as const;
