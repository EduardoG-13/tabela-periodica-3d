/**
 * Estado de brilho dos 118 módulos fora do React (atualizado a cada quadro).
 * A transição exponencial (~0,18 s) simula a resposta da fita LED.
 * Nenhuma luz dinâmica é criada por LED: o brilho é emissivo + bloom.
 */
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { GROUP_BY_ID, buttonGroupOf } from '../config/buttonGroups';
import { isLit, useStore } from '../state/store';

export const ledLevel = new Float32Array(118);
export const ledColor: THREE.Color[] = ELEMENTS.map((e) => {
  const [r, g, b] = GROUP_BY_ID[buttonGroupOf(e.number)].ledColor;
  return new THREE.Color(r, g, b);
});

const target = new Float32Array(118);

/** Avança a simulação; retorna os índices que mudaram neste quadro */
export function stepLeds(dt: number, instant: boolean): number[] {
  const s = useStore.getState();
  const changed: number[] = [];
  const k = instant ? 1 : 1 - Math.exp(-dt / 0.18);
  for (let i = 0; i < 118; i++) {
    const z = i + 1;
    let t = isLit(s, z) ? s.intensity : 0;
    if (s.selected !== null && s.selected !== z && s.phase !== 'none') t *= 0.4;
    if (s.categoryFilter && ELEMENTS[i].category !== s.categoryFilter) t *= 0.15;
    target[i] = t;
    const d = t - ledLevel[i];
    if (Math.abs(d) > 0.0005) {
      ledLevel[i] = Math.abs(d) < 0.002 ? t : ledLevel[i] + d * k;
      changed.push(i);
    }
  }
  return changed;
}
