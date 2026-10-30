/**
 * Caixa lateral de MDF com os 4 botões de arcade (foto 2: vermelho, verde,
 * amarelo e azul, na ordem da placa informativa). Botões clicáveis na cena.
 */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import arimoBold from '@fontsource/arimo/files/arimo-latin-700-normal.woff?url';
import { BUTTON_GROUPS, type ButtonGroup } from '../config/buttonGroups';
import { BUTTON_BOX } from '../lib/layout';
import { useStore } from '../state/store';
import { materials } from './materials';

function ArcadeButton({ g, x }: { g: ButtonGroup; x: number }) {
  const plunger = useRef<THREE.Group>(null!);
  const press = useRef(0);
  const mats = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({ color: g.color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color(g.color), emissiveIntensity: 0 }),
      bezel: new THREE.MeshPhysicalMaterial({ color: g.color, roughness: 0.25, clearcoat: 0.8 }),
      ring: new THREE.MeshStandardMaterial({ color: '#d9d9d9', roughness: 0.3, metalness: 0.6 }),
    }),
    [g.color],
  );
  const lastNonce = useRef(-1);
  useFrame((_, dt) => {
    const s = useStore.getState();
    const active = s.activeGroup === g.id;
    if (s.pressNonce !== lastNonce.current) {
      if (lastNonce.current !== -1 && active) press.current = 1;
      lastNonce.current = s.pressNonce;
    }
    press.current = Math.max(0, press.current - dt * 4);
    const depth = 0.0045 * press.current + (active ? 0.0018 : 0);
    plunger.current.position.y = 0.006 - depth;
    mats.body.emissiveIntensity += ((active ? 0.55 : 0) - mats.body.emissiveIntensity) * Math.min(1, dt * 10);
  });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const st = useStore.getState();
    st.pressGroup(g.id);
    st.say(`Botão ${g.label}: LEDs do grupo ${g.label} acesos; demais grupos apagados.`);
  };
  return (
    <group position={[x, 0, BUTTON_BOX.d / 2]} rotation={[Math.PI / 2, 0, 0]} onClick={onClick}
      onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      {/* aro (bezel) */}
      <mesh material={mats.bezel} position={[0, 0.002, 0]} castShadow>
        <cylinderGeometry args={[0.0165, 0.0172, 0.004, 32]} />
      </mesh>
      <mesh material={mats.ring} position={[0, 0.0042, 0]}>
        <torusGeometry args={[0.0128, 0.0009, 8, 32]} />
      </mesh>
      {/* êmbolo com topo abaulado */}
      <group ref={plunger}>
        <mesh material={mats.body} position={[0, -0.002, 0]}>
          <cylinderGeometry args={[0.0118, 0.0118, 0.008, 32]} />
        </mesh>
        <mesh material={mats.body} position={[0, 0.002, 0]} scale={[1, 0.28, 1]}>
          <sphereGeometry args={[0.0118, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
    </group>
  );
}

export function ButtonBox() {
  const mat = materials();
  const { w, h, d } = BUTTON_BOX;
  const pitch = w / 4;
  return (
    <group position={[BUTTON_BOX.x, BUTTON_BOX.y, 0]}>
      <group position={[0, 0, d / 2]}>
        <mesh material={mat.mdf} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
        {/* marcas dos encaixes queimados nas arestas */}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-w / 2 + 0.012 + i * ((w - 0.024) / 8), h / 2 + 0.0002, d / 2 - 0.0015]} material={mat.mdfEdge}>
            <boxGeometry args={[0.009, 0.0006, 0.003]} />
          </mesh>
        ))}
        {BUTTON_GROUPS.map((g, i) => (
          <ArcadeButton key={g.id} g={g} x={-w / 2 + pitch * (i + 0.5)} />
        ))}
        {BUTTON_GROUPS.map((g, i) => (
          <Text key={g.id} font={arimoBold} fontSize={0.0072} color="#333" anchorX="center" anchorY="top" position={[-w / 2 + pitch * (i + 0.5), -h / 2 + 0.0085, d / 2 + 0.0006]}>
            {g.label}
          </Text>
        ))}
      </group>
    </group>
  );
}
