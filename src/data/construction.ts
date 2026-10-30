/**
 * Especificações construtivas do módulo e da estrutura.
 *
 * Cada medida traz sua origem:
 *  - 'doc'  → documentada (arquivos caixa.svg / placa.svg ou lista de materiais do projeto)
 *  - 'est'  → estimada a partir das fotografias (aproximação visual coerente)
 * Unidades internas da cena: metros. Os valores em mm abaixo são os de referência.
 */
export type Source = 'doc' | 'est';

export const MM = 0.001;

/** Caixa do módulo — medidas lidas de caixa.svg (contornos de corte) */
export const BOX = {
  width: 180.2, // doc: tampos e frente/trás com 180,2 mm
  depth: 100.2, // doc: tampos e laterais com 100,2 mm
  height: 50.2, // doc: frente, trás e laterais com 50,2 mm
  mdf: 3, // doc: MDF 3 mm
  /** Encaixes da borda superior das paredes (onde entram as abas dos tampos) */
  topNotchDepth: 7.1, // doc
  /** Abas dos tampos no lado longo: [início, fim] em mm, medidos a partir da borda esquerda */
  lidTabsLong: [[9.3, 26.9], [45.3, 63.0], [81.2, 99.0], [117.1, 134.9], [153.3, 170.9]] as [number, number][],
  /** Abas dos tampos no lado curto */
  lidTabsShort: [[11.2, 29.0], [47.2, 53.0], [71.3, 89.0]] as [number, number][],
  /** Dedos laterais (laterais → frente/trás), medidos a partir do topo */
  cornerFingers: [[10.1, 15.9], [22.1, 27.9], [34.1, 39.9]] as [number, number][],
  sideHoleDiameter: 10, // doc: furo redondo de passagem dos fios nas laterais
  wireHoleDiameter: 2, // doc: furos pequenos do tampo inferior (3 por extremidade)
  wireHolePitch: 3, // doc
  ledSlot: { length: 100, width: 8 }, // doc: retângulo vazado do tampo superior
  acrylicSlot: { length: 10, width: 8, centerOffset: 65 }, // doc: rasgos dos "pés" do acrílico (centros a ±65 mm)
  lidGap: 1, // est: folga entre tampo inferior e superior (encaixe de 7,1 mm para dois tampos de 3 mm)
};

/** Placa de acrílico — placa.svg (140 × 126 mm, com dois pés de 10 × 6 mm) */
export const ACRYLIC = {
  width: 140, // doc
  height: 120, // doc (parte visível acima do tampo)
  legHeight: 6, // doc
  legWidth: 10, // doc
  thickness: 8, // doc: "acrílico 8–9 mm"; rasgo de 8 mm no tampo
};

/** Leiaute das gravações (placa.svg, mm a partir do topo) */
export const ENGRAVING = {
  number: { x: 5.9, top: 3.4, h: 14 },
  config: { right: 136, top: 4.7, h: 11 },
  symbol: { top: 25.5, h: 40.4 },
  name: { top: 72.9, h: 14.4 },
  mass: { top: 93.1, h: 11.5 },
};

export const LED_STRIP = {
  leds: 5, // doc: 5 LEDs por elemento
  pitch: 16.7, // est: fita de 60 LEDs/m
  width: 10, // est
  thickness: 1.6, // est
  pads: ['5V', 'GND', 'DATA'] as const, // doc (caixa.svg e etapa 3.1)
};

export const NAMEPLATE = { width: 135, height: 36, thickness: 2, source: 'est' as Source };

/** Estrutura da tabela (nichos) — estimada pelas proporções da fotografia */
export const NICHE = {
  pitchX: 190, // est
  pitchY: 205, // est
  depth: 125, // est
  wall: 3, // doc: MDF 3 mm
  wallStandoff: 25, // est: espaço técnico atrás dos nichos para canaletas
  fBlockGap: 40, // est: separação entre o período 7 e as séries f
  bottomClearance: 200, // est: altura do piso até a base da última linha
};

export type PartId =
  | 'frente' | 'laterais' | 'tampoSuperior' | 'acrilico' | 'tampoInferior' | 'fitaLed' | 'fios' | 'fundo' | 'plaquinha';

export interface PartSpec {
  id: PartId;
  order: number;
  name: string;
  material: string;
  role: string;
  dims: string;
  source: Source;
  fixing: string;
  interacts: string;
}

export const PARTS: PartSpec[] = [
  {
    id: 'frente', order: 1, name: 'Estrutura frontal de MDF', material: 'MDF 3 mm cortado a laser (bordas queimadas pelo laser)',
    role: 'Fecha a caixa pela frente e recebe a plaquinha com nome em alto-relevo e braile.',
    dims: '180,2 × 50,2 × 3 mm (caixa.svg)', source: 'doc',
    fixing: 'Encaixe tipo finger joint nas laterais e abas dos tampos; colada (cola instantânea/quente). É instalada por último, depois de testadas as conexões (etapa 4.6).',
    interacts: 'Recebe os dedos das laterais e as abas dos dois tampos; sustenta a plaquinha.',
  },
  {
    id: 'laterais', order: 2, name: 'Laterais e parte traseira da caixa', material: 'MDF 3 mm',
    role: 'Formam o corpo da caixa. As duas laterais têm furo redondo para passagem dos fios; a parte traseira não tem furos.',
    dims: 'Traseira 180,2 × 50,2 mm; laterais 100,2 × 50,2 mm com furo Ø10 mm (caixa.svg)', source: 'doc',
    fixing: 'Dedos de 3 mm encaixados nos rasgos da frente/trás; colagem.',
    interacts: 'Os encaixes de 7,1 mm na borda superior recebem as abas dos dois tampos; os furos laterais levam o cabo de 3 vias ao módulo vizinho.',
  },
  {
    id: 'tampoSuperior', order: 3, name: 'Tampo superior', material: 'MDF 3 mm',
    role: 'Esconde soldas e fios. O retângulo vazado deixa a luz da fita atingir a borda inferior do acrílico.',
    dims: '180,2 × 100,2 mm; rasgo de luz 100 × 8 mm; dois rasgos 10 × 8 mm para os pés do acrílico (caixa.svg)', source: 'doc',
    fixing: 'Abas de 3 mm nos encaixes superiores das paredes.',
    interacts: 'Alinhado exatamente sobre a fita LED do tampo inferior; guia a placa de acrílico.',
  },
  {
    id: 'acrilico', order: 4, name: 'Placa de acrílico gravada', material: 'Acrílico transparente 8–9 mm, gravado a laser',
    role: 'Difusor: a luz entra pela borda inferior e se espalha pelas gravações (número, configuração, símbolo, nome e massa).',
    dims: '140 × 126 mm (120 mm visíveis + pés de 10 × 6 mm), espessura 8 mm (placa.svg; rasgo de 8 mm)', source: 'doc',
    fixing: 'Pés encaixados nos rasgos dos dois tampos.',
    interacts: 'Recebe a luz da fita através do retângulo vazado do tampo superior.',
  },
  {
    id: 'tampoInferior', order: 5, name: 'Tampo inferior', material: 'MDF 3 mm',
    role: 'Base onde a fita LED é colada e soldada; os fios descem pelos furos pequenos.',
    dims: '180,2 × 100,2 mm; furos Ø2 mm (3 por extremidade: GND, DI/DOUT, 5V); folga até o tampo superior ≈ 1 mm (estimada)', source: 'doc',
    fixing: 'Abas nos encaixes das paredes, logo abaixo do tampo superior.',
    interacts: 'Sustenta a fita; os pés do acrílico atravessam o tampo superior e encaixam aqui.',
  },
  {
    id: 'fitaLed', order: 6, name: 'Segmento de fita LED RGB', material: 'Fita endereçável 5 V (terminais 5V, GND e DATA, sentido DIN → DOUT)',
    role: 'Ilumina a placa de acrílico com a cor do grupo químico.',
    dims: '5 LEDs; passo ≈ 16,7 mm e largura ≈ 10 mm (estimados, fita de 60 LEDs/m)', source: 'est',
    fixing: 'Colada no centro do tampo inferior, sob o retângulo vazado; soldada aos fios do conector.',
    interacts: 'Recebe DATA do módulo anterior (DIN) e repassa ao próximo (DOUT).',
  },
  {
    id: 'fios', order: 7, name: 'Fios e conectores de 3 vias', material: 'Conector de engate rápido 3 vias (macho/fêmea) e fios coloridos',
    role: 'Levam 5V, GND e DATA entre os segmentos de fita. Nas demais emendas foi usada fita isolante.',
    dims: 'Bitola média (lista de materiais); comprimentos estimados', source: 'doc',
    fixing: 'Soldados à fita; passam pelos furos do tampo inferior e pelas laterais.',
    interacts: 'Ligam o módulo à cadeia de dados e ao grupo de alimentação.',
  },
  {
    id: 'fundo', order: 8, name: 'Fundo do nicho (apoio do módulo)', material: 'MDF 3 mm da estrutura da tabela',
    role: 'O arquivo caixa.svg não tem peça de fundo: a caixa fica aberta por baixo e apoia-se no piso do nicho, por onde passam os fios.',
    dims: '≈ 184 × 125 mm (estimado pela foto)', source: 'est',
    fixing: 'Faz parte da estrutura fixada na parede.',
    interacts: 'Apoia a caixa e conduz a fiação para a parte traseira.',
  },
  {
    id: 'plaquinha', order: 9, name: 'Plaquinha de identificação acessível', material: 'Placa branca com letras em alto-relevo e pontos braile',
    role: 'Identifica o elemento pelo nome em tinta e em braile.',
    dims: '≈ 135 × 36 mm (estimado pela foto do módulo)', source: 'est',
    fixing: 'Afixada na estrutura frontal.',
    interacts: 'Acompanha a caixa ao ser retirada do nicho.',
  },
];
