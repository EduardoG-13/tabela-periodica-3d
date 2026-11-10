import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import type CameraControlsImpl from 'camera-controls';
import { useStore } from '../state/store';
import { BOARD, BUTTON_BOX, ELECTRONICS_BOX, TABLE_CENTER } from '../lib/layout';
import { extractedCenter } from './SelectedModule';
import { plateCenter } from './TableModules';

export const HOME = { pos: [-0.2, 1.5, 5.3] as const, target: [-0.45, 1.22, 0.1] as const };

/** Vista inicial afastada em telas estreitas (celular em pé), para a tabela inteira caber */
function homeFor(aspect: number) {
  if (aspect >= 1.2) return HOME;
  // tela estreita: centraliza na tabela (sem a placa informativa) e afasta o suficiente para a largura caber
  const f = Math.min(1.75, 1.45 / aspect);
  const t = [TABLE_CENTER[0], HOME.target[1], HOME.target[2]];
  const p = [TABLE_CENTER[0] + 0.05, HOME.pos[1], HOME.pos[2]];
  return { pos: p.map((v, i) => t[i] + (v - t[i]) * f), target: t };
}

export function CameraRig() {
  const size = useThree((s) => s.size);
  const home = () => homeFor(size.width / Math.max(1, size.height));
  const ref = useRef<CameraControlsImpl>(null!);
  const camera = useStore((s) => s.camera);
  const selected = useStore((s) => s.selected);
  const phase = useStore((s) => s.phase);
  const lastSelected = useRef<number | null>(null);

  const go = (pos: readonly number[], target: readonly number[]) => {
    const smooth = !useStore.getState().reducedMotion;
    void ref.current?.setLookAt(pos[0], pos[1], pos[2], target[0], target[1], target[2], smooth);
  };

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const smooth = !useStore.getState().reducedMotion;
    switch (camera.cmd) {
      case 'home': { const h = home(); go(h.pos, h.target); break; }
      case 'front': go([0, TABLE_CENTER[1], 4.4], [0, TABLE_CENTER[1], 0.1]); break;
      case 'back': go([0.3, TABLE_CENTER[1] + 0.2, -3.4], [0, TABLE_CENTER[1], 0]); break;
      case 'zoomIn': void c.dolly(0.6, smooth); break;
      case 'zoomOut': void c.dolly(-0.6, smooth); break;
      case 'board': go([BOARD.x + 0.2, BOARD.y, 1.5], [BOARD.x + 0.25, BOARD.y - 0.05, 0]); break;
      case 'buttons': go([BUTTON_BOX.x + 0.1, BUTTON_BOX.y + 0.14, BUTTON_BOX.d + 0.42], [BUTTON_BOX.x, BUTTON_BOX.y, BUTTON_BOX.d / 2]); break;
      case 'techbox': go([ELECTRONICS_BOX.x - 0.3, ELECTRONICS_BOX.y + 0.28, 0.8], [ELECTRONICS_BOX.x, ELECTRONICS_BOX.y, 0.06]); break;
      case 'electronics': go([ELECTRONICS_BOX.x - 0.15, ELECTRONICS_BOX.y + 0.35, 1.25], [ELECTRONICS_BOX.x - 0.25, ELECTRONICS_BOX.y, 0.05]); break;
      case 'element': {
        const z = useStore.getState().selected ?? useStore.getState().focused;
        if (z) {
          const c2 = extractedCenter(z);
          go([c2.x + 0.16, c2.y + 0.1, c2.z + 0.5], [c2.x, c2.y, c2.z]);
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  // aproximação ao retirar e afastamento ao devolver
  useEffect(() => {
    if (phase === 'extracting' && selected) {
      lastSelected.current = selected;
      const c = extractedCenter(selected);
      go([c.x + 0.16, c.y + 0.1, c.z + 0.52], [c.x, c.y, c.z]);
    } else if (phase === 'returning' && lastSelected.current) {
      const p = plateCenter(lastSelected.current);
      go([p.x * 0.7, p.y + 0.15, 1.9], [p.x * 0.85, p.y, 0.1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selected]);

  // afasta a câmera para enquadrar a vista explodida
  const exploded = useStore((s) => s.exploded);
  useEffect(() => {
    if (phase !== 'out' || !selected) return;
    const c = extractedCenter(selected);
    if (exploded) go([c.x + 0.35, c.y + 0.3, c.z + 0.95], [c.x, c.y + 0.06, c.z]);
    else go([c.x + 0.16, c.y + 0.1, c.z + 0.52], [c.x, c.y, c.z]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploded]);

  // inspeção das caixas: afasta a câmera na vista explodida e volta ao fechar
  const inspect = useStore((s) => s.inspect);
  const inspectExploded = useStore((s) => s.inspectExploded);
  useEffect(() => {
    if (inspect === 'botoes') {
      const k = inspectExploded ? 1 : 0;
      go([BUTTON_BOX.x + 0.1 + 0.15 * k, BUTTON_BOX.y + 0.14 + 0.12 * k, BUTTON_BOX.d + 0.42 + 0.35 * k], [BUTTON_BOX.x, BUTTON_BOX.y, BUTTON_BOX.d / 2 + 0.04 * k]);
    } else if (inspect === 'tecnica') {
      const k = inspectExploded ? 1 : 0;
      go([ELECTRONICS_BOX.x - 0.3 - 0.2 * k, ELECTRONICS_BOX.y + 0.28 + 0.12 * k, 0.8 + 0.45 * k], [ELECTRONICS_BOX.x, ELECTRONICS_BOX.y, 0.06 + 0.08 * k]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectExploded]);

  useFrame((_, dt) => {
    const s = useStore.getState();
    if (s.cameraOrbit && ref.current && s.phase === 'none') void ref.current.rotate(dt * 0.18, 0, false);
  });

  useEffect(() => {
    const h = home();
    go(h.pos, h.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <CameraControls ref={ref} makeDefault minDistance={0.12} maxDistance={14} dollySpeed={0.6} smoothTime={0.45} />;
}
