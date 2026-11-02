/**
 * Caixa de controle (4 botões) e caixa técnica (eletrônica): peças, origens e limites.
 *  doc  = documentado (SVG de corte, página do Manual Maker, documentação principal do projeto)
 *  est  = estimado (medido na foto ou suposto para montar o 3D)
 *  conf = ponto técnico a confirmar
 */
import type { Source } from './construction';
import svg from './caixaArduino.generated.json';

export type BSource = Source | 'conf';

export interface BoxPart {
  id: string;
  name: string;
  source: BSource;
  dims: string;
  role: string;
}

/** Caixa de controle — não há arquivo de corte publicado: tudo vem da foto de detalhe */
export const CONTROL_BOX = {
  width: 248, // est (foto)
  height: 71, // est (foto)
  depth: 65, // est (topo visto em escorço)
  mdf: 3, // est: mesmo MDF 3 mm dos módulos
  buttonPitch: 55, // est (centros a ≈ 81 px)
  bezelDiameter: 34, // est (≈ 50 px) — compatível com botão de arcade de 30 mm
  plungerDiameter: 24, // est
  holeDiameter: 28, // est: furo de montagem típico de botão de 30 mm (não medido)
  fingerPitch: 18, // est: encaixes queimados visíveis nas arestas
};

export const CONTROL_PARTS: BoxPart[] = [
  { id: 'frente', name: 'Face frontal com 4 furos', source: 'est', dims: '248 × 71 × 3 mm; furos ≈ Ø28 mm a cada 55 mm', role: 'Recebe os 4 botões de arcade (vermelho, verde, amarelo, azul).' },
  { id: 'tampo', name: 'Tampo superior (prateleira vazia)', source: 'est', dims: '248 × 65 × 3 mm', role: 'Superfície plana, sem botões, logo abaixo da plaquinha de créditos.' },
  { id: 'base', name: 'Fundo', source: 'est', dims: '248 × 65 × 3 mm', role: 'Fecha a caixa por baixo.' },
  { id: 'laterais', name: 'Laterais', source: 'est', dims: '65 × 71 × 3 mm', role: 'Encaixes finger joint com a frente, o tampo e o fundo.' },
  { id: 'botoes', name: 'Botões de arcade (4)', source: 'doc', dims: 'aro ≈ Ø34 mm, êmbolo ≈ Ø24 mm (estimados)', role: '“4 botões de arcade” — lista de materiais. Ordem e cores (vermelho, verde, amarelo, azul) conforme a documentação principal do projeto e a foto.' },
  { id: 'cabos', name: 'Cabos dos botões', source: 'est', dims: 'saída pela traseira, aberta para a parede (suposição)', role: 'Levam os sinais até a caixa técnica pela canaleta (trajeto ilustrativo).' },
];

export const CONTROL_NOTES = [
  'Posição, tamanho e espaçamento medidos na foto de detalhe; não há arquivo de corte desta caixa.',
  'A fixação “fita dupla face (para fixar a caixa dos botões)” consta na lista de materiais.',
  'Não há inscrições nos botões nem na caixa; a legenda das cores fica na placa informativa.',
];

export interface SvgPiece {
  id: string;
  w: number;
  h: number;
  svgX: number;
  svgY: number;
  outline: [number, number][];
  holes: ({ t: 'c'; x: number; y: number; r: number; c: string } | { t: 'e'; x: number; y: number; rx: number; ry: number; c: string } | { t: 'r'; x: number; y: number; w: number; h: number; c: string })[];
}
export const SVG_PIECES = (svg as unknown as { pieces: SvgPiece[] }).pieces;
export const svgPiece = (id: string) => SVG_PIECES.find((p) => p.id === id)!;

/** Uso de cada peça da prancha na montagem 3D. `role: null` = peça sem posição identificada */
export const TECH_PIECES: { id: string; name: string; role: string | null; feature: string }[] = [
  { id: 'placaTraseira', name: 'Painel 293,1 × 183,1 mm', role: 'Face visível (voltada para o ambiente)', feature: '70 encaixes nas bordas e 2 fileiras de 12 rasgos de 15 × 3 mm para as prateleiras' },
  { id: 'tampoCooler', name: 'Parede 286,2 × 123,2 mm com furo Ø80 mm', role: 'Tampo superior — abertura do cooler', feature: 'furo circular Ø80 mm' },
  { id: 'fundoVentilado', name: 'Parede 293,1 × 123,2 mm com grade de furos', role: 'Fundo — entrada de ar', feature: 'grade circular de furos Ø≈3 mm (área ≈ Ø80 mm)' },
  { id: 'lateralVentilada', name: 'Lateral 123,2 × 183,1 mm com grade de furos', role: 'Lateral direita — saída de ar', feature: 'grade de furos Ø≈2,3 mm e 2 fileiras de 5 rasgos' },
  { id: 'lateralPassagem', name: 'Lateral 123,8 × 176,7 mm com rasgo elíptico', role: 'Lateral esquerda — passagem de cabos', feature: 'abertura elíptica 92 × 64 mm e 2 fileiras de 5 rasgos' },
  { id: 'prateleira1', name: 'Prateleira 286 × 108 mm', role: 'Prateleira inferior', feature: 'linguetas que entram nos rasgos do painel e das laterais' },
  { id: 'prateleira2', name: 'Prateleira 286 × 108 mm', role: 'Prateleira superior', feature: 'idem' },
  { id: 'lateralA', name: 'Lateral 123,2 × 183,1 mm com rasgos', role: null, feature: 'sem furos; 2 fileiras de 5 rasgos' },
  { id: 'lateralVentiladaB', name: 'Lateral 123,2 × 183,1 mm com grade elíptica', role: null, feature: 'grade de furos Ø≈4 mm' },
  { id: 'parede183a', name: 'Parede 183,1 × 123,2 mm', role: null, feature: 'lisa, com encaixes' },
  { id: 'parede176', name: 'Parede 176,2 × 123,2 mm', role: null, feature: 'lisa, com encaixes' },
  { id: 'parede286', name: 'Parede 286,2 × 123,2 mm', role: null, feature: 'lisa, com encaixes' },
  { id: 'suporteTriangular', name: 'Peça triangular 60 × 100 mm', role: null, feature: 'possível reforço/suporte' },
];

export const TECH_NOTES = [
  'A prancha caixa_arduino.svg tem 13 contornos de peça, sem textos ou legendas. A montagem 3D usa 7 deles; as outras 6 peças (variantes ou sobressalentes?) aparecem só na prancha.',
  'A prancha também contém uma plaquinha “Tântalo” (contorno verde) e um disco de furos solto, que não fazem parte da caixa.',
  'A face com encaixes para as quatro paredes e as prateleiras não tem furos: a caixa fica aberta do lado da parede (orientação estimada). O SVG não mostra abertura traseira; a única passagem grande é o rasgo elíptico de uma lateral.',
  'Cores das linhas preservadas: preto = contornos e rasgos; azul = furos de ventilação e aberturas; vermelho = encaixes do painel; verde = plaquinha. O significado de cada cor para a cortadora não está documentado.',
  'Componentes internos (fonte, Arduinos, cooler, chave, disjuntor) têm posição e tamanho estimados: o SVG não indica onde ficam.',
];

/** Quantidade de Arduinos: a etapa 5.2 do Manual Maker diz “1 Arduino no projeto final (em vez de 4 do
 *  protótipo)”; a lista de materiais ainda cita “4 Arduinos (um por grupo)”. A cena segue a versão final. */
export const ARDUINO_COUNT = 1;
export const ARDUINO_NOTE = 'A cena mostra 1 Arduino, como na etapa 5.2 do Manual Maker (“1 Arduino no projeto final, em vez de 4 do protótipo”), que lê os 4 botões. A lista de materiais ainda cita 4 Arduinos, número do protótipo; a documentação principal registra essa divergência para revisão. Para ver a versão do protótipo, mude ARDUINO_COUNT em src/data/controlBoxes.ts.';
