/**
 * Módulo retirado do nicho: versão detalhada com cada peça separada,
 * animação de retirada/devolução, giro 360°, modo interior e vista explodida.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { BOX, LED_STRIP, MM, NICHE, PARTS, type PartId } from '../data/construction';
import { modulePosition } from '../lib/layout';
import { brailleDotPositions, brailleWidth } from '../lib/braille';
import { useStore, type ModuleFace } from '../state/store';
import { moduleGeometry, BOX_H, BRAILLE_Y, BRAILLE_Z, LID_Y, MODULE_HEIGHT } from './moduleGeometry';
import { createEngravingMaterial, materials } from './materials';
import { ledColor, ledLevel } from './ledRuntime';
import { getHighRes, type ElementTextures } from './useElementTextures';

export const OUT_DISTANCE = 0.42;
export const LIFT = 0.05;
const PIVOT_Y = MODULE_HEIGHT / 2;

export function extractedCenter(z: number): THREE.Vector3 {
  const e = ELEMENTS[z - 1];
  const [x, y, zz] = modulePosition(e.col, e.row);
  return new THREE.Vector3(x, y + LIFT + 0.004 + PIVOT_Y, zz + OUT_DISTANCE);
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const FACE_ROT: Record<ModuleFace, [number, number]> = {
  frente: [0, 0], tras: [Math.PI, 0], esquerda: [Math.PI / 2, 0], direita: [-Math.PI / 2, 0], topo: [0, Math.PI / 2], base: [0, -Math.PI / 2],
};

/** Deslocamentos da vista explodida (m), em ordem de montagem */
const EXPLODE: Record<string, [number, number, number]> = {
  frente: [0, 0, 0.1],
  plaquinha: [0, -0.015, 0.17],
  back: [0, 0, -0.1],
  sideL: [-0.13, 0, 0],
  sideR: [0.13, 0, 0],
  tampoInferior: [0, 0.055, 0],
  fitaLed: [0, 0.09, 0],
  tampoSuperior: [0, 0.13, 0],
  acrilico: [0, 0.2, 0],
  fios: [0, -0.03, -0.05],
  fundo: [0, -0.07, 0],
};

function wireGeometries() {
  const W = BOX.width, D = BOX.depth, H = BOX.height;
  const stripLen = LED_STRIP.leds * LED_STRIP.pitch;
  const colors = ['#d62828', '#202020', '#2a9d3a']; // 5V, GND, DATA
  const out: { geo: THREE.TubeGeometry; color: string }[] = [];
  for (const side of [-1, 1]) {
    colors.forEach((color, k) => {
      const dz = (k - 1) * 3;
      const pts = [
        [side * (stripLen / 2 + 2), LID_Y.inferior + BOX.mdf + 0.5, dz],
        [side * 55, LID_Y.inferior + BOX.mdf - 1, dz],
        [side * 55, LID_Y.inferior - 8, dz],
        [side * 70, 18, -D / 2 + 22 + dz],
        [side * (W / 2 - 6), H - 20, -D / 2 + 15 + dz * 0.5],
        [side * (W / 2 + 12), H - 20, -D / 2 + 15 + dz * 0.5],
        [side * (W / 2 + 26), H - 24, -D / 2 + 15 + dz * 0.5],
      ].map(([x, y, z]) => new THREE.Vector3(x * MM, y * MM, z * MM));
      out.push({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.7 * MM, 6, false), color });
    });
  }
  return out;
}

export function SelectedModule() {
  const selected = useStore((s) => s.selected);
  const phase = useStore((s) => s.phase);
  const interior = useStore((s) => s.interior);
  const selectedPart = useStore((s) => s.selectedPart);
  const face = useStore((s) => s.face);
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null;
  const geo = moduleGeometry();
  const base = materials();

  const root = useRef<THREE.Group>(null!);
  const rot = useRef<THREE.Group>(null!);
  const parts = useRef<Record<string, THREE.Group | null>>({});
  const progress = useRef(0);
  const explode = useRef(0);
  const yaw = useRef({ cur: 0, target: 0 });
  const pitch = useRef({ cur: 0, target: 0 });
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null);
  const hover = useRef(false);
  useEffect(() => {
    if (phase === 'none' || phase === 'returning') {
      hover.current = false;
      if (controls) controls.enabled = true;
    }
  }, [phase, controls]);
  const [hq, setHq] = useState<ElementTextures | null>(null);

  const wires = useMemo(wireGeometries, []);
  const m = useMemo(() => {
    const mk = () => [base.mdfFace.clone(), base.mdfEdge.clone()];
    return {
      frente: mk(), laterais: mk(), tampoSuperior: mk(), tampoInferior: mk(), fundo: mk(),
      plaquinha: base.nameplate.clone(), plateText: new THREE.MeshStandardMaterial({ color: '#141414', transparent: true, bumpScale: 1.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      acrylic: base.acrylic.clone(), edges: new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      engraving: createEngravingMaterial(null), ghost: createEngravingMaterial(null, 0.2),
      strip: base.strip.clone(), chip: base.chip.clone(),
      chipGlow: new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
      wires: wires.map((w) => new THREE.MeshStandardMaterial({ color: w.color, roughness: 0.5 })),
      connector: new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.4 }),
    };
  }, [base, wires]);

  const brailleMats = useMemo(() => {
    if (!selected) return [];
    const name = ELEMENTS[selected - 1].name;
    const w = brailleWidth(name);
    return brailleDotPositions(name).map((d) => new THREE.Matrix4().makeTranslation((d.x - w / 2) * MM, BRAILLE_Y + (2.5 - d.y) * MM, BRAILLE_Z));
  }, [selected]);
  const brailleRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    brailleMats.forEach((mm, i) => brailleRef.current?.setMatrixAt(i, mm));
    if (brailleRef.current) {
      brailleRef.current.instanceMatrix.needsUpdate = true;
      brailleRef.current.computeBoundingSphere();
    }
  }, [brailleMats]);

  // texturas em alta resolução
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    setHq(null);
    getHighRes(selected).then((t) => alive && setHq(t));
    progress.current = 0;
    yaw.current = { cur: 0, target: 0 };
    pitch.current = { cur: 0, target: 0 };
    return () => void (alive = false);
  }, [selected]);
  useEffect(() => {
    for (const mt of [m.engraving, m.ghost]) {
      mt.uniforms.map.value = hq?.engraving ?? null;
      mt.uniforms.hasMap.value = hq ? 1 : 0;
    }
    m.plateText.alphaMap = hq?.nameplate ?? null;
    m.plateText.bumpMap = hq?.nameplate ?? null;
    m.plateText.visible = !!hq;
    m.plateText.needsUpdate = true;
  }, [hq, m]);

  useEffect(() => {
    if (face.nonce === 0) return;
    const [y, p] = FACE_ROT[face.face];
    // escolhe o giro mais curto até a face pedida
    const cur = yaw.current.target;
    yaw.current.target = cur + Math.atan2(Math.sin(y - cur), Math.cos(y - cur));
    pitch.current.target = p;
  }, [face]);

  // modo interior e destaque da peça selecionada
  useEffect(() => {
    const see = interior ? 0.14 : 1;
    const ghostMats = [...m.frente, ...m.laterais, ...m.tampoSuperior];
    for (const mt of ghostMats) {
      mt.transparent = interior;
      mt.opacity = see;
      mt.depthWrite = !interior;
      mt.needsUpdate = true;
    }
    const all: [PartId, THREE.Material[]][] = [
      ['frente', m.frente], ['laterais', m.laterais], ['tampoSuperior', m.tampoSuperior], ['tampoInferior', m.tampoInferior], ['fundo', m.fundo],
      ['plaquinha', [m.plaquinha]], ['fitaLed', [m.strip]], ['fios', [...m.wires, m.connector]], ['acrilico', [m.acrylic]],
    ];
    for (const [id, list] of all)
      for (const mt of list) {
        const s = mt as THREE.MeshStandardMaterial;
        if (s.emissive) {
          s.emissive.set(selectedPart === id ? '#3b82f6' : '#000000');
          s.emissiveIntensity = selectedPart === id ? 0.55 : 0;
        }
      }
  }, [interior, selectedPart, m]);

  useEffect(() => {
    if (!selected) return;
    const e = ELEMENTS[selected - 1];
    useStore.getState().say(`${e.name} retirado do nicho. Número atômico ${e.number}.`);
  }, [selected]);

  useFrame((_, dtRaw) => {
    const st = useStore.getState();
    if (!selected || st.phase === 'none') return;
    const dt = Math.min(dtRaw, 0.05);
    const instant = st.reducedMotion;
    const i = selected - 1;
    // rotação e explosão
    if (st.autoRotate && st.phase === 'out') yaw.current.target += dt * 0.8;
    if (st.phase === 'returning') {
      yaw.current.target = Math.round(yaw.current.target / (Math.PI * 2)) * Math.PI * 2;
      pitch.current.target = 0;
    }
    const kr = instant ? 1 : 1 - Math.exp(-dt / 0.15);
    yaw.current.cur += (yaw.current.target - yaw.current.cur) * kr;
    pitch.current.cur += (pitch.current.target - pitch.current.cur) * kr;
    rot.current.rotation.set(pitch.current.cur, yaw.current.cur, 0, 'XYZ');

    const ke = instant ? 1 : 1 - Math.exp(-dt / 0.22);
    explode.current += ((st.exploded && st.phase === 'out' ? 1 : 0) - explode.current) * ke;
    const ex = explode.current;
    for (const [id, off] of Object.entries(EXPLODE)) {
      const g = parts.current[id];
      if (g) g.position.set(off[0] * ex, off[1] * ex, off[2] * ex);
    }

    // trajetória: levanta 4 mm, desliza para fora do nicho e sobe levemente
    if (st.phase === 'extracting') {
      progress.current = instant ? 1 : Math.min(1, progress.current + dt / 1.3);
      if (progress.current >= 1) useStore.setState({ phase: 'out' });
    } else if (st.phase === 'returning') {
      const settled = Math.abs(yaw.current.cur - yaw.current.target) < 0.05 && Math.abs(pitch.current.cur) < 0.05 && ex < 0.05;
      if (settled || instant) progress.current = instant ? 0 : Math.max(0, progress.current - dt / 1.1);
      if (progress.current <= 0) {
        useStore.setState({ phase: 'none', selected: null });
        return;
      }
    }
    const p = progress.current;
    const e = ELEMENTS[i];
    const [x, y, z] = modulePosition(e.col, e.row);
    const out = easeInOut(Math.min(1, Math.max(0, (p - 0.08) / 0.92)));
    root.current.position.set(x, y + 0.004 * smooth(0, 0.12, p) + LIFT * smooth(0.45, 1, p) + PIVOT_Y, z + out * OUT_DISTANCE);

    // LEDs do módulo
    const l = ledLevel[i];
    const c = ledColor[i];
    m.engraving.uniforms.intensity.value = l;
    m.engraving.uniforms.ledColor.value.copy(c);
    m.ghost.uniforms.intensity.value = l;
    m.ghost.uniforms.ledColor.value.copy(c);
    m.edges.color.copy(c).multiplyScalar(l * 1.6);
    m.chipGlow.color.copy(c).multiplyScalar(l * 3);
    m.chip.emissive.copy(c).multiplyScalar(l * 0.8);
  });

  if (!selected || phase === 'none') return null;

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
    if (controls) controls.enabled = false;
    (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    e.stopPropagation();
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.moved += Math.abs(dx) + Math.abs(dy);
    yaw.current.target += dx * 0.012;
    pitch.current.target = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.current.target + dy * 0.012));
    useStore.setState({ autoRotate: false });
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (controls) controls.enabled = !hover.current;
    const moved = drag.current?.moved ?? 0;
    drag.current = null;
    if (moved < 5) {
      const id = e.object.userData.part as PartId | undefined;
      const st = useStore.getState();
      if (id && (st.exploded || st.interior || st.mode === 'engenharia')) {
        e.stopPropagation();
        useStore.setState({ selectedPart: id });
        const part = PARTS.find((p) => p.id === id)!;
        st.say(`${part.name}. ${part.role}`);
      }
    }
  };

  const P = (id: string, children: React.ReactNode, part?: PartId) => (
    <group ref={(g) => void (parts.current[id] = g)} userData={{ part: part ?? id }}>
      {children}
    </group>
  );
  const ud = (part: PartId) => ({ part });

  return (
    <group ref={root}>
      <group ref={rot} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        onPointerOver={(e) => { e.stopPropagation(); hover.current = true; if (controls) controls.enabled = false; document.body.style.cursor = 'grab'; }}
        onPointerOut={() => { hover.current = false; if (!drag.current && controls) controls.enabled = true; document.body.style.cursor = ''; }}>
        <group position={[0, -PIVOT_Y, 0]}>
          {P('frente', <mesh geometry={geo.front} material={m.frente} userData={ud('frente')} castShadow />)}
          {P('plaquinha', <>
            <mesh geometry={geo.nameplate} material={m.plaquinha} userData={ud('plaquinha')} />
            <mesh geometry={geo.nameplateFace} material={m.plateText} userData={ud('plaquinha')} />
            <instancedMesh ref={brailleRef} args={[geo.braille, base.braille, Math.max(1, brailleMats.length)]} userData={ud('plaquinha')} />
          </>)}
          {P('back', <mesh geometry={geo.back} material={m.laterais} userData={ud('laterais')} />, 'laterais')}
          {P('sideL', <mesh geometry={geo.sideL} material={m.laterais} userData={ud('laterais')} />, 'laterais')}
          {P('sideR', <mesh geometry={geo.sideR} material={m.laterais} userData={ud('laterais')} />, 'laterais')}
          {P('tampoSuperior', <mesh geometry={geo.lidTop} material={m.tampoSuperior} userData={ud('tampoSuperior')} />)}
          {P('tampoInferior', <mesh geometry={geo.lidBottom} material={m.tampoInferior} userData={ud('tampoInferior')} />)}
          {P('fitaLed', <>
            <mesh geometry={geo.strip} material={m.strip} userData={ud('fitaLed')} />
            {geo.chipOffsets.map((x, k) => (
              <group key={k} position={[x, 0, 0]}>
                <mesh geometry={geo.chip} material={m.chip} userData={ud('fitaLed')} />
                <mesh geometry={geo.chip} material={m.chipGlow} scale={[1.25, 1.1, 1.25]} userData={ud('fitaLed')} />
              </group>
            ))}
          </>)}
          {P('acrilico', <>
            <mesh geometry={geo.acrylic} material={m.acrylic} userData={ud('acrilico')} renderOrder={3} />
            <mesh geometry={geo.edges} material={m.edges} userData={ud('acrilico')} renderOrder={4} />
            <mesh geometry={geo.engraving} material={m.engraving} userData={ud('acrilico')} renderOrder={6} />
            <mesh geometry={geo.engravingBack} material={m.ghost} userData={ud('acrilico')} renderOrder={5} />
          </>)}
          {P('fios', <>
            {wires.map((w, k) => <mesh key={k} geometry={w.geo} material={m.wires[k]} userData={ud('fios')} />)}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (BOX.width / 2 + 30) * MM, (BOX.height - 25) * MM, (-BOX.depth / 2 + 15) * MM]} material={m.connector} userData={ud('fios')}>
                <boxGeometry args={[0.012, 0.007, 0.011]} />
              </mesh>
            ))}
          </>)}
          {P('fundo', (
            <mesh position={[0, -0.0015, 0]} material={m.fundo[0]} userData={ud('fundo')} receiveShadow>
              <boxGeometry args={[(NICHE.pitchX - 6) * MM, NICHE.wall * MM, NICHE.depth * MM]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export const MODULE_BOX_H = BOX_H;
