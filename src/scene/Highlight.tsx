import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { cellOrigin, NICHE_FRONT_Z, PITCH_X, PITCH_Y } from '../lib/layout';
import { useStore } from '../state/store';

/** Moldura luminosa suave na frente do nicho focado (teclado/mouse) ou selecionado */
function Frame({ which, color }: { which: 'focus' | 'selected'; color: string }) {
  const g = useRef<THREE.Group>(null!);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const base = useMemo(() => new THREE.Color(color), [color]);
  useFrame(({ clock }) => {
    const s = useStore.getState();
    const z = which === 'selected' ? (s.phase !== 'none' ? s.selected : null) : (s.hovered ?? s.focused);
    if (!z || (which === 'focus' && s.phase !== 'none' && z === s.selected)) {
      g.current.visible = false;
      return;
    }
    const e = ELEMENTS[z - 1];
    const o = cellOrigin(e.col, e.row);
    g.current.visible = true;
    g.current.position.set(o.x, o.y + PITCH_Y / 2, NICHE_FRONT_Z + 0.002);
    const pulse = which === 'selected' && !s.reducedMotion ? 0.75 + 0.25 * Math.sin(clock.elapsedTime * 3) : 1;
    mat.color.copy(base).multiplyScalar(pulse * 1.6);
  });
  const t = 0.004, w = PITCH_X, h = PITCH_Y;
  const bars: [number, number, number, number][] = [[0, h / 2, w, t], [0, -h / 2, w, t], [-w / 2, 0, t, h], [w / 2, 0, t, h]];
  return (
    <group ref={g} visible={false}>
      {bars.map(([x, y, ww, hh], i) => (
        <mesh key={i} position={[x, y, 0]} material={mat}>
          <planeGeometry args={[ww, hh]} />
        </mesh>
      ))}
    </group>
  );
}

export function Highlights() {
  return (
    <>
      <Frame which="focus" color="#dfe9ff" />
      <Frame which="selected" color="#7fd4ff" />
    </>
  );
}
