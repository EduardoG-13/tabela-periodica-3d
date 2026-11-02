import { create } from 'zustand';
import type { ButtonGroupId } from '../config/buttonGroups';
import { buttonGroupOf } from '../config/buttonGroups';
import type { CategoryId } from '../data/elements';
import type { PartId } from '../data/construction';

export type ActiveGroup = ButtonGroupId | 'todos' | 'nenhum';
export type AppMode = 'explorar' | 'iluminacao' | 'engenharia' | 'acessibilidade';
export type ElectronicsView = 'off' | 'normal' | 'circuito' | 'alimentacao' | 'dados' | 'identificados' | 'explodido';
export type Phase = 'none' | 'extracting' | 'out' | 'returning';
export type CameraCommand = 'home' | 'front' | 'back' | 'zoomIn' | 'zoomOut' | 'board' | 'buttons' | 'electronics' | 'element' | 'techbox';
/** Objeto em inspeção: caixa de controle (botões) ou caixa técnica (eletrônica) */
export type InspectTarget = 'none' | 'botoes' | 'tecnica';
export type ModuleFace = 'frente' | 'tras' | 'esquerda' | 'direita' | 'topo' | 'base';

interface State {
  view: '3d' | 'flat';
  mode: AppMode;
  activeGroup: ActiveGroup;
  /** Ligações individuais (true/false) que sobrepõem o estado do grupo */
  overrides: Record<number, boolean>;
  intensity: number;
  pressNonce: number;

  selected: number | null;
  phase: Phase;
  focused: number | null;
  hovered: number | null;

  autoRotate: boolean;
  interior: boolean;
  exploded: boolean;
  selectedPart: PartId | null;
  face: { face: ModuleFace; nonce: number };

  categoryFilter: CategoryId | null;
  showLabels: boolean;
  showWiring: boolean;
  electronics: ElectronicsView;

  inspect: InspectTarget;
  /** tampa aberta / paredes translúcidas */
  inspectOpen: boolean;
  inspectExploded: boolean;
  /** desmontagem explícita dos botões da face frontal */
  buttonsDetached: boolean;
  inspectPart: string | null;

  camera: { cmd: CameraCommand; nonce: number };
  cameraOrbit: boolean;

  reducedMotion: boolean;
  textScale: number;
  narration: boolean;
  caption: string;
  quality: 'alta' | 'economica';
  compareWith: number | null;
  sidebarOpen: boolean;
  a11yOpen: boolean;

  set: (p: Partial<State>) => void;
  pressGroup: (g: ActiveGroup) => void;
  toggleLed: (z: number) => void;
  select: (z: number | null) => void;
  returnToNiche: () => void;
  cameraCmd: (cmd: CameraCommand) => void;
  setFace: (face: ModuleFace) => void;
  say: (text: string) => void;
  openInspect: (t: InspectTarget) => void;
  closeInspect: () => void;
}

const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const useStore = create<State>((set, get) => ({
  view: '3d',
  mode: 'explorar',
  activeGroup: 'todos',
  overrides: {},
  intensity: 1,
  pressNonce: 0,
  selected: null,
  phase: 'none',
  focused: null,
  hovered: null,
  autoRotate: false,
  interior: false,
  exploded: false,
  selectedPart: null,
  face: { face: 'frente', nonce: 0 },
  categoryFilter: null,
  showLabels: false,
  showWiring: false,
  electronics: 'off',
  inspect: 'none',
  inspectOpen: false,
  inspectExploded: false,
  buttonsDetached: false,
  inspectPart: null,
  camera: { cmd: 'home', nonce: 0 },
  cameraOrbit: false,
  reducedMotion: !!prefersReduced,
  textScale: 1,
  narration: false,
  caption: '',
  quality: 'alta',
  compareWith: null,
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 900 : true,
  a11yOpen: false,

  set: (p) => set(p),
  // Lógica do projeto original (etapa 5.2): apaga todos e acende somente o grupo escolhido.
  pressGroup: (g) => set((s) => ({ activeGroup: g, overrides: {}, pressNonce: s.pressNonce + 1 })),
  toggleLed: (z) => set((s) => ({ overrides: { ...s.overrides, [z]: !isLit(s, z) } })),
  select: (z) => {
    const s = get();
    if (z === null) return get().returnToNiche();
    if (s.inspect !== 'none') set({ inspect: 'none', inspectOpen: false, inspectExploded: false, buttonsDetached: false, inspectPart: null });
    // sem cena 3D montada (visão plana) não há animação de retirada
    if (s.view === 'flat') return set({ selected: z, phase: 'out', exploded: false, interior: false, selectedPart: null, focused: z });
    if (s.phase !== 'none' && s.selected !== z) {
      // troca direta: devolve o atual instantaneamente e retira o novo
      set({ selected: z, phase: 'extracting', exploded: false, interior: false, selectedPart: null, autoRotate: false, focused: z });
    } else if (s.phase === 'none') {
      set({ selected: z, phase: 'extracting', exploded: false, interior: false, selectedPart: null, autoRotate: false, focused: z });
    }
  },
  returnToNiche: () => {
    const s = get();
    if (s.view === 'flat') return set({ selected: null, phase: 'none', exploded: false, interior: false, selectedPart: null });
    if (s.selected !== null && (s.phase === 'out' || s.phase === 'extracting')) set({ phase: 'returning', exploded: false, interior: false, autoRotate: false, selectedPart: null });
  },
  cameraCmd: (cmd) => set((s) => ({ camera: { cmd, nonce: s.camera.nonce + 1 } })),
  setFace: (face) => set((s) => ({ face: { face, nonce: s.face.nonce + 1 }, autoRotate: false })),
  openInspect: (t) => {
    if (get().phase !== 'none') get().returnToNiche();
    set({ inspect: t, inspectOpen: false, inspectExploded: false, buttonsDetached: false, inspectPart: null });
    get().cameraCmd(t === 'botoes' ? 'buttons' : 'techbox');
    get().say(t === 'botoes' ? 'Inspeção da caixa de controle com os quatro botões.' : 'Inspeção da caixa técnica dos eletrônicos.');
  },
  // volta à montagem original; a tabela não se move, só a câmera retorna
  closeInspect: () => {
    set({ inspect: 'none', inspectOpen: false, inspectExploded: false, buttonsDetached: false, inspectPart: null });
    get().cameraCmd('home');
  },
  say: (text) => {
    set({ caption: text });
    if (get().narration && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      window.speechSynthesis.speak(u);
    }
  },
}));

export function groupLit(activeGroup: ActiveGroup, z: number): boolean {
  if (activeGroup === 'todos') return true;
  if (activeGroup === 'nenhum') return false;
  return buttonGroupOf(z) === activeGroup;
}

export function isLit(s: Pick<State, 'activeGroup' | 'overrides'>, z: number): boolean {
  const o = s.overrides[z];
  return o === undefined ? groupLit(s.activeGroup, z) : o;
}
