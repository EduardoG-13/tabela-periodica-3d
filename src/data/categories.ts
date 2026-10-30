import type { CategoryId, StateCode } from './elements';

export const CATEGORIES: Record<CategoryId, { label: string; color: string }> = {
  'nao-metal': { label: 'Ametal (não metal reativo)', color: '#4fb3a2' },
  'gas-nobre': { label: 'Gás nobre', color: '#5b7ff0' },
  alcalino: { label: 'Metal alcalino', color: '#e8705a' },
  alcalinoterroso: { label: 'Metal alcalinoterroso', color: '#f0a54a' },
  transicao: { label: 'Metal de transição', color: '#d8c35a' },
  'pos-transicao': { label: 'Metal pós-transição', color: '#8fb35a' },
  semimetal: { label: 'Semimetal (metaloide)', color: '#5ab38f' },
  halogenio: { label: 'Halogênio', color: '#3fa7c9' },
  lantanideo: { label: 'Lantanídeo', color: '#c57ad8' },
  actinideo: { label: 'Actinídeo', color: '#e07aa8' },
  desconhecido: { label: 'Propriedades químicas desconhecidas', color: '#9a9aa6' },
};

export const STATES: Record<StateCode, string> = {
  s: 'sólido',
  l: 'líquido',
  g: 'gasoso',
  p: 'sólido (presumido — nunca obtido em quantidade visível)',
  u: 'desconhecido (nunca obtido em quantidade macroscópica)',
};
