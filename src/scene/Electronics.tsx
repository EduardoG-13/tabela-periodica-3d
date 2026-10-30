/**
 * Modo "Explorar eletrônica": caixa dos eletrônicos, fiação na parte traseira,
 * fluxos de alimentação e de dados. Elementos não documentados são
 * identificados como ilustrativos ou "a confirmar" (ver data/electronics.ts).
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { WIRE_LEGEND } from '../data/electronics';
import { BUTTON_BOX, cellOrigin, ELECTRONICS_BOX, modulePosition, PITCH_X, TABLE_BOTTOM, TABLE_RIGHT } from '../lib/layout';
import { useStore, type ElectronicsView } from '../state/store';
import { materials } from './materials';

const C = Object.fromEntries(WIRE_LEGEND.map((w) => [w.label.split(' ')[0], w.color]));
const COL = { v24: C['24'], v5: C['5'], gnd: '#3a3a3a', data: C['DATA'], v12: C['12'], btn: C['Sinais'] };
const CAVITY_Z = 0.012;

function flowMaterial(color: string, kind: 'power' | 'data' | 'other') {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, time: { value: 0 }, flow: { value: 0 }, length: { value: 1 }, dim: { value: 1 } },
    toneMapped: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 color; uniform float time; uniform float flow; uniform float length; uniform float dim; varying vec2 vUv;
      void main(){
        float shade = 0.55 + 0.45 * abs(sin(vUv.y * 3.14159));
        float p = fract(vUv.x * length * ${kind === 'data' ? '14.0' : '8.0'} - time * ${kind === 'data' ? '2.4' : '1.4'});
        float pulse = smoothstep(0.0, 0.15, p) * (1.0 - smoothstep(0.15, 0.45, p));
        vec3 c = color * shade * dim + color * pulse * flow * 2.6;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
}

interface Wire { pts: THREE.Vector3[]; color: string; kind: 'power' | 'data' | 'other'; r?: number }

function buildWires(): Wire[] {
  const wires: Wire[] = [];
  const box = ELECTRONICS_BOX;
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // linha de dados: zigue-zague pelas linhas, passando de módulo em módulo (ilustrativo)
  const data: THREE.Vector3[] = [new THREE.Vector3(box.x - 0.05, box.y, 0.04), new THREE.Vector3(TABLE_RIGHT + 0.03, box.y, CAVITY_Z)];
  const topY = cellOrigin(18, 1).y;
  data.push(new THREE.Vector3(TABLE_RIGHT + 0.03, topY + 0.03, CAVITY_Z));
  rows.forEach((r, ri) => {
    const els = ELEMENTS.filter((e) => e.row === r).sort((a, b) => a.col - b.col);
    if (ri % 2 === 0) els.reverse();
    const y = cellOrigin(1, r).y + 0.03;
    for (const e of els) data.push(new THREE.Vector3(modulePosition(e.col, e.row)[0], y, CAVITY_Z));
  });
  wires.push({ pts: data, color: COL.data, kind: 'data', r: 0.0022 });
  // barramentos de 5 V e GND por linha + subida vertical a partir da caixa
  const busX = TABLE_RIGHT + 0.06;
  const v5: THREE.Vector3[] = [], gnd: THREE.Vector3[] = [];
  for (const r of rows) {
    const els = ELEMENTS.filter((e) => e.row === r);
    const minC = Math.min(...els.map((e) => e.col)), y = cellOrigin(1, r).y + 0.012;
    const x0 = cellOrigin(minC, r).x - PITCH_X / 2 + 0.02;
    wires.push({ pts: [new THREE.Vector3(busX, y, CAVITY_Z), new THREE.Vector3(x0, y, CAVITY_Z)], color: COL.v5, kind: 'power' });
    wires.push({ pts: [new THREE.Vector3(busX + 0.012, y + 0.008, CAVITY_Z - 0.004), new THREE.Vector3(x0, y + 0.008, CAVITY_Z - 0.004)], color: COL.gnd, kind: 'power' });
    v5.push(new THREE.Vector3(busX, y, CAVITY_Z));
    gnd.push(new THREE.Vector3(busX + 0.012, y + 0.008, CAVITY_Z - 0.004));
  }
  const ys = v5.map((p) => p.y);
  wires.push({ pts: [new THREE.Vector3(box.x - 0.06, box.y - 0.03, 0.05), new THREE.Vector3(busX, box.y - 0.03, CAVITY_Z), new THREE.Vector3(busX, Math.max(...ys), CAVITY_Z)], color: COL.v5, kind: 'power', r: 0.003 });
  wires.push({ pts: [new THREE.Vector3(busX, box.y - 0.03, CAVITY_Z), new THREE.Vector3(busX, Math.min(...ys), CAVITY_Z)], color: COL.v5, kind: 'power', r: 0.003 });
  wires.push({ pts: [new THREE.Vector3(box.x - 0.06, box.y - 0.045, 0.05), new THREE.Vector3(busX + 0.012, box.y - 0.045, CAVITY_Z - 0.004), new THREE.Vector3(busX + 0.012, Math.max(...ys) + 0.008, CAVITY_Z - 0.004)], color: COL.gnd, kind: 'power', r: 0.003 });
  wires.push({ pts: [new THREE.Vector3(busX + 0.012, box.y - 0.045, CAVITY_Z - 0.004), new THREE.Vector3(busX + 0.012, Math.min(...ys) + 0.008, CAVITY_Z - 0.004)], color: COL.gnd, kind: 'power', r: 0.003 });
  // dentro da caixa: fonte → conversores
  const bx = box.x, by = box.y, bz = box.d / 2 + 0.005;
  wires.push({ pts: [new THREE.Vector3(bx + 0.02, by - 0.03, bz), new THREE.Vector3(bx - 0.03, by - 0.03, bz), new THREE.Vector3(bx - 0.06, by + 0.02, bz)], color: COL.v24, kind: 'power', r: 0.0022 });
  wires.push({ pts: [new THREE.Vector3(bx + 0.02, by - 0.02, bz), new THREE.Vector3(bx + 0.08, by + 0.03, bz), new THREE.Vector3(bx + 0.12, by + 0.04, bz)], color: COL.v12, kind: 'power', r: 0.0018 });
  wires.push({ pts: [new THREE.Vector3(bx - 0.06, by + 0.02, bz), new THREE.Vector3(bx - 0.09, by - 0.02, bz), new THREE.Vector3(bx - 0.12, by - 0.03, 0.05)], color: COL.v5, kind: 'power', r: 0.0022 });
  // botões → Arduino pela canaleta inferior (ilustrativo)
  const chanY = TABLE_BOTTOM - 0.04;
  wires.push({
    pts: [new THREE.Vector3(BUTTON_BOX.x, BUTTON_BOX.y - BUTTON_BOX.h / 2, 0.02), new THREE.Vector3(BUTTON_BOX.x, chanY, 0.015), new THREE.Vector3(TABLE_RIGHT + 0.1, chanY, 0.015), new THREE.Vector3(bx - 0.08, by - box.h / 2 - 0.01, 0.04), new THREE.Vector3(bx - 0.05, by + 0.02, bz)],
    color: COL.btn, kind: 'data', r: 0.0025,
  });
  return wires;
}

function WireMesh({ w, view }: { w: Wire; view: ElectronicsView }) {
  const { geo, mat, len } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(w.pts, false, 'catmullrom', 0.02);
    const len = curve.getLength();
    return { geo: new THREE.TubeGeometry(curve, Math.max(24, Math.round(len * 160)), w.r ?? 0.0018, 6, false), mat: flowMaterial(w.color, w.kind), len };
  }, [w]);
  useFrame(({ clock }) => {
    mat.uniforms.time.value = useStore.getState().reducedMotion ? 0 : clock.elapsedTime;
    mat.uniforms.length.value = len;
    const powerOn = view === 'alimentacao' && w.kind === 'power';
    const dataOn = view === 'dados' && w.kind === 'data';
    mat.uniforms.flow.value = powerOn || dataOn ? 1 : 0;
    mat.uniforms.dim.value = (view === 'alimentacao' && w.kind !== 'power') || (view === 'dados' && w.kind !== 'data') ? 0.25 : 1;
  });
  return <mesh geometry={geo} material={mat} />;
}

function Box({ size, pos, color, metal = 0, rough = 0.6, children }: { size: [number, number, number]; pos: [number, number, number]; color: string; metal?: number; rough?: number; children?: React.ReactNode }) {
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
      {children}
    </mesh>
  );
}

function Label({ pos, text, tag }: { pos: [number, number, number]; text: string; tag: string }) {
  return (
    <Html position={pos} center distanceFactor={1.6} zIndexRange={[20, 0]}>
      <div className="e-label"><span className={`tag ${tag}`}>{tag === 'doc' ? 'documentado' : tag === 'est' ? 'estimado' : tag === 'ilu' ? 'ilustrativo' : 'a confirmar'}</span> {text}</div>
    </Html>
  );
}

function Fan() {
  const blades = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (!useStore.getState().reducedMotion) blades.current.rotation.z += dt * 18;
  });
  return (
    <group>
      <Box size={[0.04, 0.04, 0.012]} pos={[0, 0, 0]} color="#1b1b1d" />
      <group ref={blades} position={[0, 0, 0.007]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.004, 0.034, 0.001]} />
            <meshStandardMaterial color="#2c2c30" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Electronics() {
  const view = useStore((s) => s.electronics);
  const showWiring = useStore((s) => s.showWiring);
  const wires = useMemo(buildWires, []);
  const mat = materials();
  const box = ELECTRONICS_BOX;
  const open = view !== 'off' && view !== 'normal';
  const wiresVisible = open || showWiring;
  const exploded = view === 'explodido';
  const lid = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.8, transparent: true }), []);
  useFrame(() => {
    lid.opacity = THREE.MathUtils.lerp(lid.opacity, open ? 0.12 : 1, 0.15);
    lid.depthWrite = lid.opacity > 0.9;
  });
  const ex = exploded ? 1 : 0;

  return (
    <group>
      {/* caixa dos eletrônicos (presente na foto, à direita do Rn) */}
      <group position={[box.x, box.y, 0]}>
        <mesh position={[0, 0, 0.003]} material={mat.mdf}>
          <boxGeometry args={[box.w, box.h, 0.006]} />
        </mesh>
        {/* paredes laterais e frente removível */}
        <mesh position={[0, box.h / 2 - 0.003, box.d / 2]} material={lid}><boxGeometry args={[box.w, 0.006, box.d]} /></mesh>
        <mesh position={[0, -box.h / 2 + 0.003, box.d / 2]} material={lid}><boxGeometry args={[box.w, 0.006, box.d]} /></mesh>
        <mesh position={[-box.w / 2 + 0.003, 0, box.d / 2]} material={lid}><boxGeometry args={[0.006, box.h, box.d]} /></mesh>
        <mesh position={[box.w / 2 - 0.003, 0, box.d / 2]} material={lid}><boxGeometry args={[0.006, box.h, box.d]} /></mesh>
        <mesh position={[0, 0, box.d + 0.003 + ex * 0.18]} material={lid}><boxGeometry args={[box.w, box.h, 0.006]} /></mesh>
        {/* chave geral na frente e cooler na lateral */}
        <group position={[-box.w / 2 + 0.04, -box.h / 2 + 0.03, box.d + 0.007 + ex * 0.18]}>
          <Box size={[0.022, 0.014, 0.006]} pos={[0, 0, 0]} color="#111" />
          <Box size={[0.009, 0.011, 0.004]} pos={[0.004, 0, 0.004]} color="#c81e1e" rough={0.3} />
        </group>
        <group position={[box.w / 2 + 0.007 + ex * 0.12, 0.02, box.d / 2]} rotation={[0, Math.PI / 2, 0]}><Fan /></group>
        {/* placa interna fixada por espaçadores */}
        <group position={[0, 0, 0.02 + ex * 0.08]}>
          <Box size={[box.w - 0.03, box.h - 0.03, 0.004]} pos={[0, 0, 0]} color="#d8d2c4" />
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
            <mesh key={i} position={[sx * (box.w / 2 - 0.03), sy * (box.h / 2 - 0.03), -0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.003, 0.003, 0.02, 10]} />
              <meshStandardMaterial color="#b8b8b8" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
          {/* fonte 24 V / 2 A */}
          <group position={[0.05, -0.03, 0.022 + ex * 0.08]}>
            <Box size={[0.11, 0.05, 0.035]} pos={[0, 0, 0]} color="#a9adb2" metal={0.7} rough={0.45} />
            <Box size={[0.03, 0.04, 0.006]} pos={[-0.055, 0, 0.012]} color="#222" />
          </group>
          {/* conversores a confirmar (marcados com cor de alerta) */}
          <group position={[-0.07, 0.035, 0.008 + ex * 0.12]}>
            <Box size={[0.045, 0.024, 0.008]} pos={[0, 0, 0]} color="#1e3a8a" />
            <Box size={[0.047, 0.026, 0.002]} pos={[0, 0, -0.004]} color="#ef4444" />
          </group>
          <group position={[0.1, 0.05, 0.008 + ex * 0.12]}>
            <Box size={[0.03, 0.02, 0.008]} pos={[0, 0, 0]} color="#1e3a8a" />
            <Box size={[0.032, 0.022, 0.002]} pos={[0, 0, -0.004]} color="#ef4444" />
          </group>
          {/* Arduino (formato Uno) */}
          <group position={[-0.06, -0.03, 0.006 + ex * 0.16]}>
            <Box size={[0.0686, 0.0534, 0.0016]} pos={[0, 0, 0]} color="#0b6e99" rough={0.5} />
            <Box size={[0.012, 0.016, 0.011]} pos={[-0.03, 0.012, 0.006]} color="#c0c0c0" metal={0.8} />
            <Box size={[0.009, 0.012, 0.011]} pos={[-0.03, -0.015, 0.006]} color="#111" />
            <Box size={[0.035, 0.008, 0.004]} pos={[0.008, -0.004, 0.002]} color="#222" />
            <Box size={[0.05, 0.003, 0.008]} pos={[0.005, 0.024, 0.004]} color="#111" />
            <Box size={[0.04, 0.003, 0.008]} pos={[0.01, -0.024, 0.004]} color="#111" />
          </group>
          {/* disjuntor pequeno */}
          <group position={[0.005, 0.045, 0.02 + ex * 0.1]}>
            <Box size={[0.018, 0.05, 0.04]} pos={[0, 0, 0]} color="#f5f5f2" rough={0.5} />
            <Box size={[0.008, 0.012, 0.01]} pos={[0, 0.006, 0.023]} color="#1d4ed8" />
          </group>
        </group>
      </group>

      {/* canaleta de PVC levando os cabos dos botões (trajeto estimado; exibida com a fiação) */}
      {wiresVisible && <>
      <mesh position={[(BUTTON_BOX.x + TABLE_RIGHT + 0.1) / 2, TABLE_BOTTOM - 0.04, 0.012]} castShadow>
        <boxGeometry args={[TABLE_RIGHT + 0.1 - BUTTON_BOX.x, 0.02, 0.016]} />
        <meshStandardMaterial color="#f3f3f1" roughness={0.6} transparent opacity={wiresVisible ? 0.35 : 1} />
      </mesh>
      <mesh position={[BUTTON_BOX.x, (BUTTON_BOX.y + TABLE_BOTTOM - 0.04) / 2, 0.012]} castShadow>
        <boxGeometry args={[0.02, BUTTON_BOX.y - TABLE_BOTTOM + 0.04, 0.016]} />
        <meshStandardMaterial color="#f3f3f1" roughness={0.6} transparent opacity={wiresVisible ? 0.35 : 1} />
      </mesh>
      </>}

      {wiresVisible && wires.map((w, i) => <WireMesh key={i} w={w} view={view} />)}
      {wiresVisible && <Connectors />}

      {view === 'identificados' && (
        <group>
          <Label pos={[box.x + 0.05, box.y - 0.03, 0.17]} text="Fonte 24 V / 2 A" tag="doc" />
          <Label pos={[box.x - 0.07, box.y + 0.06, 0.15]} text="Conversão 24 V → 5 V" tag="conf" />
          <Label pos={[box.x + 0.1, box.y + 0.09, 0.15]} text="12 V do cooler" tag="conf" />
          <Label pos={[box.x - 0.06, box.y - 0.06, 0.16]} text="Arduino (1 no projeto final)" tag="doc" />
          <Label pos={[box.x + 0.005, box.y + 0.085, 0.13]} text="Disjuntor" tag="doc" />
          <Label pos={[box.x - box.w / 2 + 0.04, box.y - box.h / 2 + 0.005, 0.15]} text="Chave geral" tag="doc" />
          <Label pos={[box.x + box.w / 2 + 0.04, box.y + 0.05, 0.06]} text="Cooler 12 V" tag="doc" />
          <Label pos={[BUTTON_BOX.x, BUTTON_BOX.y + 0.06, 0.08]} text="Botões de arcade" tag="doc" />
          <Label pos={[0, TABLE_BOTTOM - 0.07, 0.05]} text="Canaleta PVC — cabos dos botões" tag="est" />
          <Label pos={[TABLE_RIGHT + 0.06, cellOrigin(18, 3).y, 0.06]} text="Barramento 5 V / GND" tag="ilu" />
          <Label pos={[0, cellOrigin(9, 1).y + 0.05, 0.06]} text="Cadeia DATA (DIN → DOUT)" tag="ilu" />
        </group>
      )}
    </group>
  );
}

/** Conectores de engate rápido de 3 vias atrás de cada módulo */
function Connectors() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const mats = useMemo(() => ELEMENTS.map((e) => {
    const [x] = modulePosition(e.col, e.row);
    return new THREE.Matrix4().makeTranslation(x + 0.06, cellOrigin(1, e.row).y + 0.03, CAVITY_Z);
  }), []);
  useFrame(() => {
    if (ref.current.userData.done) return;
    mats.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.userData.done = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, mats.length]}>
      <boxGeometry args={[0.012, 0.007, 0.008]} />
      <meshStandardMaterial color="#f2f2ee" roughness={0.4} />
    </instancedMesh>
  );
}
