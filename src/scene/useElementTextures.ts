/**
 * Carregamento progressivo das texturas das gravações e plaquinhas:
 * gera alguns módulos por quadro após o carregamento das fontes, para que a
 * cena apareça imediatamente e as inscrições surjam em sequência.
 */
import { useEffect, useState } from 'react';
import type * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { ensureFonts, makeEngravingTexture, makeNameplateTexture } from '../lib/textures';

export interface ElementTextures {
  engraving: THREE.DataTexture;
  nameplate: THREE.DataTexture;
}

const store: (ElementTextures | undefined)[] = new Array(118);
const listeners = new Set<() => void>();
let started = false;

function start() {
  if (started) return;
  started = true;
  ensureFonts().then(() => {
    let i = 0;
    const tick = () => {
      const end = Math.min(118, i + 6);
      for (; i < end; i++) store[i] = { engraving: makeEngravingTexture(ELEMENTS[i], 512), nameplate: makeNameplateTexture(ELEMENTS[i], 384) };
      listeners.forEach((l) => l());
      if (i < 118) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function useElementTextures(): (ElementTextures | undefined)[] {
  const [, setN] = useState(0);
  useEffect(() => {
    start();
    const l = () => setN((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return store;
}

const hq = new Map<number, ElementTextures>();
/** Texturas em alta resolução (1024 px) para o módulo retirado do nicho */
export async function getHighRes(z: number): Promise<ElementTextures> {
  await ensureFonts();
  let t = hq.get(z);
  if (!t) {
    t = { engraving: makeEngravingTexture(ELEMENTS[z - 1], 1024), nameplate: makeNameplateTexture(ELEMENTS[z - 1], 1024) };
    hq.set(z, t);
    if (hq.size > 8) {
      const [k, v] = hq.entries().next().value!;
      v.engraving.dispose();
      v.nameplate.dispose();
      hq.delete(k);
    }
  }
  return t;
}
