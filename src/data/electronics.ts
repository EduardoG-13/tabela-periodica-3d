/**
 * Sistema eletrônico — o que é documentado e o que é representação.
 * Fonte: lista de materiais e etapas da página do projeto (Manual Maker),
 * caixa.svg (terminais 5V/GND/DI/DOUT) e protótipo Tinkercad (circuito.jpg).
 *  doc  = documentado    est = posição/medida estimada
 *  ilu  = representação ilustrativa (roteamento não documentado)
 *  conf = ponto técnico a confirmar
 */
export type ESource = 'doc' | 'est' | 'ilu' | 'conf';

export interface EComponent {
  id: string;
  name: string;
  source: ESource;
  spec: string;
  note: string;
}

export const COMPONENTS: EComponent[] = [
  { id: 'fonte', name: 'Fonte 24 V / 2 A', source: 'doc', spec: '24 V CC, 2 A (48 W) — lista de materiais', note: 'Alimenta todo o sistema. Modelo, posição e fixação na caixa são estimados.' },
  { id: 'conversor', name: 'Conversão 24 V → 5 V', source: 'conf', spec: 'NÃO documentado', note: 'As fitas têm terminais de 5 V e o Arduino trabalha em 5 V; ligar 24 V direto nas fitas as danificaria. A documentação não descreve o regulador usado: este bloco marca o ponto a confirmar, sem propor um circuito definitivo.' },
  { id: 'conversor12', name: 'Alimentação do cooler (12 V)', source: 'conf', spec: 'NÃO documentado', note: 'O cooler da lista é de 12 V; a forma de obter 12 V a partir da fonte de 24 V não está descrita.' },
  { id: 'arduino', name: 'Arduino (1 no projeto final)', source: 'doc', spec: 'Placa no formato Arduino Uno (o protótipo usou 4 Uno; o modelo final não é informado)', note: 'Lê os 4 botões, guarda vetores de LEDs por grupo e apaga todos antes de acender o grupo escolhido (etapa 5.2).' },
  { id: 'chave', name: 'Mini interruptor (chave geral)', source: 'doc', spec: 'Liga/desliga geral', note: 'Posição na caixa estimada.' },
  { id: 'disjuntor', name: 'Disjuntor pequeno', source: 'doc', spec: 'Dispositivo de proteção — corrente nominal não informada', note: 'Posição e modelo estimados.' },
  { id: 'cooler', name: 'Cooler 12 V', source: 'doc', spec: 'Ventilação da caixa dos eletrônicos; tamanho estimado (40 mm)', note: 'Fica na lateral da caixa dos eletrônicos.' },
  { id: 'caixa', name: 'Caixa dos eletrônicos', source: 'est', spec: '≈ 280 × 170 × 120 mm (estimado pela foto 1, à direita do Rn)', note: 'Caixa interna fixada com parafusos e espaçadores (lista de materiais).' },
  { id: 'botoes', name: 'Caixa dos 4 botões de arcade', source: 'doc', spec: 'Fixada com fita dupla face', note: 'Cabos até o Arduino: roteamento ilustrativo pela canaleta inferior.' },
  { id: 'fitas', name: 'Fitas LED RGB (118 × 5 LEDs = 590)', source: 'doc', spec: 'Terminais 5V, GND, DATA; sentido DIN → DOUT', note: 'Conectores de engate rápido de 3 vias apenas nos trechos de fita.' },
  { id: 'dados', name: 'Linha de dados (DATA)', source: 'ilu', spec: 'Cadeia DIN → DOUT', note: 'A ordem real de encadeamento não está documentada. Aqui a cadeia percorre as linhas em zigue-zague, passando pelos furos laterais das caixas.' },
  { id: 'grupos', name: 'Grupos de alimentação', source: 'ilu', spec: 'Recomendação: grupos de 3 segmentos (etapa 2.2)', note: 'Para não perder brilho, cada grupo de segmentos recebe sua própria alimentação. Os pontos de injeção mostrados são ilustrativos.' },
  { id: 'canaletas', name: 'Canaletas de PVC autoadesivas', source: 'doc', spec: 'Organizam os fios externamente', note: 'Trajetos estimados.' },
];

export const WIRE_LEGEND = [
  { color: '#ff8a00', label: '24 V (saída da fonte)', source: 'doc' as ESource },
  { color: '#e02424', label: '5 V para fitas e Arduino (após conversão a confirmar)', source: 'conf' as ESource },
  { color: '#2b2b2b', label: 'GND (comum)', source: 'doc' as ESource },
  { color: '#22c55e', label: 'DATA — cadeia DIN → DOUT', source: 'ilu' as ESource },
  { color: '#3b82f6', label: '12 V do cooler (origem a confirmar)', source: 'conf' as ESource },
  { color: '#c084fc', label: 'Sinais dos 4 botões', source: 'ilu' as ESource },
];

/** Estimativa de consumo — apenas para orientar a verificação técnica */
export const POWER_NOTE = {
  leds: 590,
  maxPerLedA: 0.06,
  get maxA() { return this.leds * this.maxPerLedA; },
  supplyW: 48,
  get supply5vA() { return this.supplyW / 5; },
};
