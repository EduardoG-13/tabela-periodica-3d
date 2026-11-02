/**
 * Caixa técnica reconstruída a partir das peças de caixa_arduino.svg
 * (contornos, encaixes, rasgos, furos de ventilação, furo do cooler e rasgo elíptico
 * extraídos do arquivo — src/data/caixaArduino.generated.json).
 *
 * Sistema local (mm): x ao longo da largura (293,1), y para cima (183,1), z saindo da parede
 * (profundidade 123,2). A atribuição de cada peça a uma face é ESTIMADA (ver TECH_NOTES).
 */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ARDUINO_COUNT, svgPiece, type SvgPiece } from '../data/controlBoxes';
import { ELECTRONICS_BOX } from '../lib/layout';
import { useStore } from '../state/store';
import { burntTexture } from '../lib/textures';

type V3 = [number, number, number];
const MM = 0.001;

/** Encaixe de cada peça: P = O + x·ax + y·ay + t·an (x, y em coordenadas do SVG; t = espessura) */
interface Mount { id: string; o: V3; ax: V3; ay: V3; an: V3; explode: V3; label: string }
export const TECH_MOUNTS: Mount[] = [
  { id: 'placaTraseira', o: [-146.55, 91.55, 120.2], ax: [1, 0, 0], ay: [0, -1, 0], an: [0, 0, 1], explode: [0, 0, 170], label: 'Painel com encaixes (face visível)' },
  { id: 'tampoCooler', o: [-143.1, 88, 0], ax: [1, 0, 0], ay: [0, 0, 1], an: [0, -1, 0], explode: [0, 90, 0], label: 'Tampo com furo do cooler' },
  { id: 'fundoVentilado', o: [-146.55, -88, 123.2], ax: [1, 0, 0], ay: [0, 0, -1], an: [0, 1, 0], explode: [0, -90, 0], label: 'Fundo com entrada de ar' },
  { id: 'lateralVentilada', o: [140, -91.55, 123.2], ax: [0, 0, -1], ay: [0, 1, 0], an: [1, 0, 0], explode: [100, 0, 0], label: 'Lateral com saída de ar' },
  { id: 'lateralPassagem', o: [-143, -88.35, 123.2], ax: [0, 0, -1], ay: [0, 1, 0], an: [1, 0, 0], explode: [-100, 0, 0], label: 'Lateral com passagem de cabos' },
  { id: 'prateleira1', o: [-143, -35.95, 15.2], ax: [1, 0, 0], ay: [0, 0, 1], an: [0, -1, 0], explode: [0, -20, 85], label: 'Prateleira inferior' },
  { id: 'prateleira2', o: [-143, 15.05, 15.2], ax: [0, 0, 1], ay: [1, 0, 0], an: [0, -1, 0], explode: [0, 25, 85], label: 'Prateleira superior' },
];

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mountPoint = (m: Mount, x: number, y: number, t = 0) => add(add(add(m.o, m.ax, x), m.ay, y), m.an, t);

function pieceGeometry(p: SvgPiece, m: Mount): THREE.BufferGeometry {
  const s = new THREE.Shape();
  p.outline.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  for (const h of p.holes) {
    const path = new THREE.Path();
    if (h.t === 'c') path.absarc(h.x, h.y, h.r, 0, Math.PI * 2, true);
    else if (h.t === 'e') path.absellipse(h.x, h.y, h.rx, h.ry, 0, Math.PI * 2, true, 0);
    else {
      path.moveTo(h.x - h.w / 2, h.y - h.h / 2);
      path.lineTo(h.x - h.w / 2, h.y + h.h / 2);
      path.lineTo(h.x + h.w / 2, h.y + h.h / 2);
      path.lineTo(h.x + h.w / 2, h.y - h.h / 2);
      path.closePath();
    }
    s.holes.push(path);
  }
  const big = p.holes.some((h) => h.t !== 'r' && ((h.t === 'c' && h.r > 10) || h.t === 'e'));
  const g = new THREE.ExtrudeGeometry(s, { depth: 3, bevelEnabled: false, curveSegments: big ? 32 : 5 });
  const mat = new THREE.Matrix4().makeBasis(new THREE.Vector3(...m.ax), new THREE.Vector3(...m.ay), new THREE.Vector3(...m.an)).setPosition(...m.o);
  g.applyMatrix4(mat);
  g.scale(MM, MM, MM);
  g.computeVertexNormals();
  return g;
}

/** Ponto central do rasgo elíptico (saída dos cabos), em coordenadas do mundo */
const passMount = TECH_MOUNTS.find((m) => m.id === 'lateralPassagem')!;
const ell = svgPiece('lateralPassagem').holes.find((h) => h.t === 'e')!;
const passLocal = mountPoint(passMount, ell.x, ell.y, 1.5);
export const PASSAGE_WORLD = new THREE.Vector3(ELECTRONICS_BOX.x + passLocal[0] * MM, ELECTRONICS_BOX.y + passLocal[1] * MM, passLocal[2] * MM);
export const techWorld = (x: number, y: number, z: number) => new THREE.Vector3(ELECTRONICS_BOX.x + x * MM, ELECTRONICS_BOX.y + y * MM, z * MM);

const ARDUINO_SLOTS: V3[] = [[-20, -34, 70], [65, -34, 70], [20, 17, 70], [100, 17, 70]];
const TECH_COMPONENTS_POS = {
  fonte: [45, -67, 62] as V3, disjuntor: [-105, -64, 75] as V3, chave: [-60, -76, 105] as V3,
  conversor5v: [-95, -27, 70] as V3, conversor12v: [-80, 23, 95] as V3, cooler: [-80, 72, 63.6] as V3, arduino: ARDUINO_SLOTS[0],
};
/** Componentes internos — POSIÇÕES E TAMANHOS ESTIMADOS (mm, sistema local) */
export const TECH_COMPONENTS = {
  fonte: { pos: TECH_COMPONENTS_POS.fonte, size: [110, 36, 78] as V3 },
  disjuntor: { pos: TECH_COMPONENTS_POS.disjuntor, size: [18, 40, 55] as V3 },
  chave: { pos: TECH_COMPONENTS_POS.chave, size: [21, 15, 14] as V3 },
  conversor5v: { pos: TECH_COMPONENTS_POS.conversor5v, size: [45, 15, 25] as V3 },
  conversor12v: { pos: TECH_COMPONENTS_POS.conversor12v, size: [30, 12, 20] as V3 },
  cooler: { pos: TECH_COMPONENTS_POS.cooler, size: [80, 25, 80] as V3 },
  arduinos: ARDUINO_SLOTS.slice(0, ARDUINO_COUNT),
};

/** Centro das furações de uma peça (grade de ventilação ou furo maior), em mm locais da caixa */
function holeCenter(id: string, pred: (h: SvgPiece['holes'][number]) => boolean): V3 {
  const m = TECH_MOUNTS.find((x) => x.id === id)!;
  const hs = svgPiece(id).holes.filter(pred);
  const cx = hs.reduce((a, h) => a + h.x, 0) / hs.length, cy = hs.reduce((a, h) => a + h.y, 0) / hs.length;
  return mountPoint(m, cx, cy, 1.5);
}
const smallRound = (h: SvgPiece['holes'][number]) => h.t === 'c' && h.r < 5;

/** Marcadores numerados da inspeção. `group` diz qual conjunto móvel o marcador acompanha na vista explodida. */
export const TECH_MARKERS: { n: number; part: string; text: string; tag: 'doc' | 'est' | 'conf'; group: string; pos: V3 }[] = [
  { n: 1, part: 'placaTraseira', text: 'Painel com encaixes e rasgos das prateleiras (SVG)', tag: 'doc', group: 'placaTraseira', pos: [0, 60, 124] },
  { n: 2, part: 'cooler', text: 'Cooler 12 V no furo Ø80 do tampo', tag: 'doc', group: 'fan', pos: add(TECH_COMPONENTS_POS.cooler, [0, 16, 0]) },
  { n: 3, part: 'fundoVentilado', text: 'Grade de entrada de ar no fundo (SVG)', tag: 'doc', group: 'fundoVentilado', pos: holeCenter('fundoVentilado', smallRound) },
  { n: 4, part: 'lateralVentilada', text: 'Grade de saída de ar na lateral (SVG)', tag: 'doc', group: 'lateralVentilada', pos: holeCenter('lateralVentilada', smallRound) },
  { n: 5, part: 'lateralPassagem', text: 'Rasgo elíptico 92 × 64 mm: passagem de cabos (SVG)', tag: 'doc', group: 'lateralPassagem', pos: holeCenter('lateralPassagem', (h) => h.t === 'e') },
  { n: 6, part: 'fonte', text: 'Fonte 24 V / 2 A (posição estimada)', tag: 'est', group: 'bottom', pos: add(TECH_COMPONENTS_POS.fonte, [0, 22, 0]) },
  { n: 7, part: 'disjuntor', text: 'Disjuntor (posição estimada)', tag: 'est', group: 'bottom', pos: add(TECH_COMPONENTS_POS.disjuntor, [0, 24, 0]) },
  { n: 8, part: 'chave', text: 'Chave geral (posição estimada)', tag: 'est', group: 'bottom', pos: add(TECH_COMPONENTS_POS.chave, [0, 12, 0]) },
  { n: 9, part: 'conversor', text: 'Conversão 24 V → 5 V (a confirmar)', tag: 'conf', group: 'shelf1', pos: add(TECH_COMPONENTS_POS.conversor5v, [0, 12, 0]) },
  { n: 10, part: 'arduino', text: 'Arduino (posição estimada)', tag: 'est', group: 'shelf1', pos: add(TECH_COMPONENTS_POS.arduino, [0, 12, 0]) },
  { n: 11, part: 'conversor12', text: '12 V do cooler (a confirmar)', tag: 'conf', group: 'shelf2', pos: add(TECH_COMPONENTS_POS.conversor12v, [0, 10, 0]) },
];

const INTERIOR_GROUPS = new Set(['bottom', 'shelf1', 'shelf2']);

function Markers({ group }: { group: string }) {
  const inspect = useStore((s) => s.inspect);
  const part = useStore((s) => s.inspectPart);
  const seeInside = useStore((s) => s.inspectOpen || s.inspectExploded);
  if (inspect !== 'tecnica') return null;
  // marcadores de componentes internos só aparecem quando o interior está visível (painel transparente ou vista explodida)
  if (INTERIOR_GROUPS.has(group) && !seeInside) return null;
  return (
    <>
      {TECH_MARKERS.filter((m) => m.group === group).map((m) => (
        <Html key={m.n} position={m.pos.map((v) => v * MM) as V3} center zIndexRange={[20, 0]}>
          <button type="button" className={`marker ${part === m.part ? 'on' : ''}`} aria-label={`${m.n}: ${m.text}`}
            onClick={() => useStore.setState({ inspectPart: m.part })}>
            {m.n}{part === m.part && <span className="marker-text">{m.text}</span>}
          </button>
        </Html>
      ))}
    </>
  );
}

function Comp({ pos, size, color, metal = 0, rough = 0.6, onClick, part }: { pos: V3; size: V3; color: string; metal?: number; rough?: number; onClick: (id: string) => (e: ThreeEvent<MouseEvent>) => void; part: string }) {
  return (
    <mesh position={pos.map((v) => v * MM) as V3} onClick={onClick(part)} castShadow>
      <boxGeometry args={size.map((v) => v * MM) as V3} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  );
}

function Fan({ onClick }: { onClick: (id: string) => (e: ThreeEvent<MouseEvent>) => void }) {
  const blades = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (!useStore.getState().reducedMotion) blades.current.rotation.y += dt * 14;
  });
  const c = TECH_COMPONENTS.cooler;
  return (
    <group position={c.pos.map((v) => v * MM) as V3} onClick={onClick('cooler')}>
      {/* moldura quadrada com abertura circular */}
      {[[0, 37.5], [0, -37.5], [37.5, 0], [-37.5, 0]].map(([x, z], i) => (
        <mesh key={i} position={[x * MM, 0, z * MM]}>
          <boxGeometry args={[(x ? 5 : 80) * MM, 25 * MM, (z ? 5 : 80) * MM]} />
          <meshStandardMaterial color="#1b1b1d" roughness={0.6} />
        </mesh>
      ))}
      <mesh><cylinderGeometry args={[0.016, 0.016, 0.024, 24]} /><meshStandardMaterial color="#222" /></mesh>
      <group ref={blades}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0.35, (i / 7) * Math.PI * 2, 0]} position={[Math.cos((i / 7) * Math.PI * 2) * 0.024, 0, -Math.sin((i / 7) * Math.PI * 2) * 0.024]}>
            <boxGeometry args={[0.03, 0.0015, 0.016]} />
            <meshStandardMaterial color="#2e2e33" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Arduino({ pos, i, onClick }: { pos: V3; i: number; onClick: (id: string) => (e: ThreeEvent<MouseEvent>) => void }) {
  return (
    <group position={pos.map((v) => v * MM) as V3} onClick={onClick('arduino')} userData={{ i }}>
      <mesh position={[0, -0.0007, 0]}><boxGeometry args={[0.0686, 0.0016, 0.0534]} /><meshStandardMaterial color="#0b6e99" roughness={0.5} /></mesh>
      <mesh position={[-0.03, 0.005, -0.012]}><boxGeometry args={[0.016, 0.011, 0.012]} /><meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[-0.03, 0.005, 0.015]}><boxGeometry args={[0.014, 0.011, 0.009]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.008, 0.002, 0.004]}><boxGeometry args={[0.035, 0.004, 0.008]} /><meshStandardMaterial color="#222" /></mesh>
      <mesh position={[0.005, 0.004, -0.024]}><boxGeometry args={[0.05, 0.008, 0.003]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0.01, 0.004, 0.024]}><boxGeometry args={[0.04, 0.008, 0.003]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
}

/** Fios internos (estimados), presos às peças que acompanham */
function InternalWires({ onClick }: { onClick: (id: string) => (e: ThreeEvent<MouseEvent>) => void }) {
  const wires = useMemo(() => {
    const C = TECH_COMPONENTS;
    const p = (v: V3) => new THREE.Vector3(v[0] * MM, v[1] * MM, v[2] * MM);
    const list: { pts: THREE.Vector3[]; color: string }[] = [
      { pts: [p([-10, -60, 62]), p([-50, -55, 70]), p([-90, -36, 70])], color: '#ff8a00' }, // 24 V → conversor (a confirmar)
      { pts: [p([-10, -60, 50]), p([-60, -40, 40]), p([-85, 10, 60]), p([-80, 16, 95])], color: '#ff8a00' }, // 24 V → conversor 12 V
      { pts: [p([-80, 29, 95]), p([-80, 55, 100]), p([-80, 60, 90])], color: '#3b82f6' }, // 12 V → cooler
      { pts: [p(passLocal), p([-125, 45, 63]), p([-100, -15, 70]), p([-95, -20, 70])], color: '#e02424' }, // 5 V para as fitas
      { pts: [p(passLocal), p([-125, 40, 58]), p([-100, -15, 60]), p([-95, -20, 60])], color: '#2b2b2b' }, // GND
    ];
    C.arduinos.forEach((a, i) => {
      list.push({ pts: [p([a[0] - 25, a[1] + 8, a[2] - 24]), p([a[0] - 40, a[1] + 20, a[2] - 20]), p([-125, 50 - i * 3, 64 + i * 3]), p(passLocal)], color: '#22c55e' }); // DATA
      list.push({ pts: [p([a[0] + 20, a[1] + 8, a[2] + 24]), p([a[0], a[1] + 22, a[2] + 30]), p([-128, 56 - i * 3, 70 - i * 3]), p(passLocal)], color: '#c084fc' }); // botões
      list.push({ pts: [p([-90, -20, 80]), p([a[0] - 30, a[1] + 5, 95]), p([a[0] - 30, a[1] + 4, a[2] + 10])], color: '#e02424' }); // 5 V Arduino
    });
    return list.map((w) => ({ geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(w.pts), 32, 0.0011, 5, false), mat: new THREE.MeshStandardMaterial({ color: w.color, roughness: 0.5 }) }));
  }, []);
  return <group onClick={onClick('fios')}>{wires.map((w, i) => <mesh key={i} geometry={w.geo} material={w.mat} />)}</group>;
}

export function TechBox() {
  const geos = useMemo(() => TECH_MOUNTS.map((m) => pieceGeometry(svgPiece(m.id), m)), []);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const inner = useRef<THREE.Group>(null!);
  const shelfLoads = useRef<(THREE.Group | null)[]>([]);
  const ex = useRef(0);
  const bottomLoad = useRef<THREE.Group>(null!);
  const fanLoad = useRef<THREE.Group>(null!);
  const wiresRef = useRef<THREE.Group>(null!);
  const mats = useMemo(() => {
    const burnt = burntTexture().clone();
    burnt.repeat.set(1 / 6, 1 / 6);
    burnt.needsUpdate = true;
    return TECH_MOUNTS.map(() => [
      new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.82, transparent: true, side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ map: burnt, color: '#5a4636', roughness: 0.95, transparent: true, side: THREE.DoubleSide }),
    ]);
  }, []);

  useFrame((_, dt) => {
    const s = useStore.getState();
    const inspecting = s.inspect === 'tecnica';
    const exploded = s.electronics === 'explodido' || (inspecting && s.inspectExploded);
    const k = s.reducedMotion ? 1 : 1 - Math.exp(-dt / 0.25);
    ex.current += ((exploded ? 1 : 0) - ex.current) * k;
    const see = ['circuito', 'alimentacao', 'dados', 'identificados'].includes(s.electronics) || (inspecting && s.inspectOpen);
    TECH_MOUNTS.forEach((m, i) => {
      const g = groups.current[i];
      if (g) g.position.set(m.explode[0] * MM * ex.current, m.explode[1] * MM * ex.current, m.explode[2] * MM * ex.current);
      // painel frontal (tampa de manutenção) e paredes ficam translúcidos para revelar o interior
      const isShell = !m.id.startsWith('prateleira');
      const target = see && isShell ? (m.id === 'placaTraseira' ? 0.1 : 0.28) : 1;
      for (const mt of mats[i]) {
        mt.opacity += (target - mt.opacity) * k;
        mt.depthWrite = mt.opacity > 0.95;
      }
      const hl = inspecting && s.inspectPart === m.id;
      mats[i][0].emissive.set(hl ? '#3b82f6' : '#000000');
      mats[i][0].emissiveIntensity = hl ? 0.5 : 0;
    });
    // cargas das prateleiras e componentes acompanham suas peças
    shelfLoads.current.forEach((g, j) => {
      const m = TECH_MOUNTS.find((x) => x.id === (j === 0 ? 'prateleira1' : 'prateleira2'))!;
      if (g) g.position.set(0, m.explode[1] * MM * ex.current, m.explode[2] * MM * ex.current);
    });
    const f = TECH_MOUNTS[2].explode, t = TECH_MOUNTS[1].explode;
    bottomLoad.current.position.set(0, f[1] * MM * ex.current, 0);
    fanLoad.current.position.set(0, t[1] * MM * ex.current, 0);
    wiresRef.current.visible = ex.current < 0.05;
    inner.current.visible = see || ex.current > 0.02 || inspecting;
  });

  const pick = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const st = useStore.getState();
    if (st.inspect !== 'tecnica') return st.openInspect('tecnica');
    useStore.setState({ inspectPart: id });
  };
  const C = TECH_COMPONENTS;
  const lower = C.arduinos.filter((a) => a[1] < 0), upper = C.arduinos.filter((a) => a[1] > 0);

  return (
    <group position={[ELECTRONICS_BOX.x, ELECTRONICS_BOX.y, 0]}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => (document.body.style.cursor = '')}>
      {TECH_MOUNTS.map((m, i) => (
        <group key={m.id} ref={(g) => void (groups.current[i] = g)}>
          <mesh geometry={geos[i]} material={mats[i]} castShadow receiveShadow onClick={pick(m.id)} />
          <Markers group={m.id} />
        </group>
      ))}
      <group ref={inner}>
        {/* compartimento inferior (sobre o fundo): fonte, disjuntor e chave — fixos no fundo */}
        <group ref={bottomLoad}>
          <Comp pos={C.fonte.pos} size={C.fonte.size} color="#a9adb2" metal={0.7} rough={0.45} onClick={pick} part="fonte" />
          <Comp pos={C.disjuntor.pos} size={C.disjuntor.size} color="#f5f5f2" rough={0.5} onClick={pick} part="disjuntor" />
          <Comp pos={C.chave.pos} size={C.chave.size} color="#c81e1e" rough={0.3} onClick={pick} part="chave" />
          <Markers group="bottom" />
        </group>
        <group ref={(g) => void (shelfLoads.current[0] = g)}>
          <Comp pos={C.conversor5v.pos} size={C.conversor5v.size} color="#1e3a8a" onClick={pick} part="conversor" />
          {lower.map((a, i) => <Arduino key={i} pos={a} i={i} onClick={pick} />)}
          <Markers group="shelf1" />
        </group>
        <group ref={(g) => void (shelfLoads.current[1] = g)}>
          <Comp pos={C.conversor12v.pos} size={C.conversor12v.size} color="#1e3a8a" onClick={pick} part="conversor12" />
          {upper.map((a, i) => <Arduino key={i} pos={a} i={i + lower.length} onClick={pick} />)}
          <Markers group="shelf2" />
        </group>
        <group ref={fanLoad}><Fan onClick={pick} /><Markers group="fan" /></group>
        {/* fios internos ligam peças de compartimentos diferentes: somem durante a vista explodida em vez de se esticarem */}
        <group ref={wiresRef}><InternalWires onClick={pick} /></group>
        {/* conectores de 3 vias na saída de cabos */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(passLocal[0] + 12) * MM, (passLocal[1] - 10 + i * 10) * MM, (passLocal[2] - 20) * MM]} onClick={pick('conectores')}>
            <boxGeometry args={[0.012, 0.007, 0.01]} />
            <meshStandardMaterial color="#f2f2ee" roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
