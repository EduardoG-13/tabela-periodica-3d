/**
 * MAPEAMENTO DOS 4 BOTÕES DE ARCADE  —  configuração editável.
 *
 * Origem: OBSERVADO na fotografia da instalação (imagem 1, todos os grupos acesos),
 * em que cada módulo exibe a cor do seu grupo, e na placa informativa (imagem 5),
 * que lista os grupos Hidrogênio (vermelho), Metais (verde), Ametais (amarelo) e
 * Gases Nobres (azul), na mesma ordem dos botões da caixa lateral.
 *
 * A documentação escrita do projeto não traz a lista de elementos de cada botão;
 * a lista abaixo foi lida das cores dos LEDs na foto. Repare que a instalação
 * agrupa B, Si, As, Te, At e Ts com os ametais e Ge, Sb e Po com os metais —
 * escolha didática da equipe, diferente da classificação científica exibida no
 * painel de cada elemento.
 *
 * Para alterar: edite `members` (números atômicos). O grupo com `rest: true`
 * recebe todos os elementos não listados nos demais.
 */
export type ButtonGroupId = 'hidrogenio' | 'metais' | 'ametais' | 'gases';

export interface ButtonGroup {
  id: ButtonGroupId;
  label: string;
  /** Cor do botão e dos LEDs do grupo */
  color: string;
  /** Cor emitida pelos LEDs (RGB linear aproximado) */
  ledColor: [number, number, number];
  members?: number[];
  rest?: boolean;
  braille: string;
}

export const BUTTON_GROUPS: ButtonGroup[] = [
  { id: 'hidrogenio', label: 'Hidrogênio', color: '#e3262f', ledColor: [1.0, 0.07, 0.06], members: [1], braille: 'Hidrogênio' },
  { id: 'metais', label: 'Metais', color: '#14a03c', ledColor: [0.1, 1.0, 0.18], rest: true, braille: 'Metais' },
  {
    id: 'ametais', label: 'Ametais', color: '#f2c200', ledColor: [1.0, 0.8, 0.05],
    members: [5, 6, 7, 8, 9, 14, 15, 16, 17, 33, 34, 35, 52, 53, 85, 117], braille: 'Ametais',
  },
  { id: 'gases', label: 'Gases Nobres', color: '#1f6fe0', ledColor: [0.12, 0.3, 1.0], members: [2, 10, 18, 36, 54, 86, 118], braille: 'Gases Nobres' },
];

export const MAPPING_SOURCE = 'Mapeamento lido das cores da fotografia da instalação (editável em src/config/buttonGroups.ts).';

const explicit = new Map<number, ButtonGroupId>();
for (const g of BUTTON_GROUPS) for (const z of g.members ?? []) explicit.set(z, g.id);
const restGroup = BUTTON_GROUPS.find((g) => g.rest)!.id;

export function buttonGroupOf(z: number): ButtonGroupId {
  return explicit.get(z) ?? restGroup;
}

export const GROUP_BY_ID = Object.fromEntries(BUTTON_GROUPS.map((g) => [g.id, g])) as Record<ButtonGroupId, ButtonGroup>;
