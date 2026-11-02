/**
 * Modo "Explorar eletrônica": caixa técnica (TechBox, a partir de caixa_arduino.svg),
 * fiação atrás da tabela, fluxos de alimentação e de dados. A caixa de controle
 * (botões) é outro objeto (ButtonBox). Roteamentos não documentados são ilustrativos.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { WIRE_LEGEND } from '../data/electronics';
import { BUTTON_BOX, cellOrigin, ELECTRONICS_BOX, modulePosition, PITCH_X, TABLE_BOTTOM, TABLE_LEFT, TABLE_RIGHT } from '../lib/layout';
import { useStore, type ElectronicsView } from '../state/store';
import { PASSAGE_WORLD, TECH_COMPONENTS, TechBox, techWorld } from './TechBox';

const C = Object.fromEntries(WIRE_LEGEND.map((w) => [w.label.split(' ')[0], w.color]));
const COL = { v5: C['5'], gnd: '#3a3a3a', data: C['DATA'], btn: C['Sinais'] };
/** Espaço técnico atrás dos nichos (entre a parede e o fundo dos nichos) */
const CAVITY_Z = 0.012;

function flowMaterial(color: string, kind: 'power' | 'data') {
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

interface Wire { pts: THREE.Vector3[]; color: string; kind: 'power' | 'data'; r?: number }

/** Os cabos saem da caixa técnica pelo rasgo elíptico da lateral, voltada para a tabela */
function buildWires(): Wire[] {
  const wires: Wire[] = [];
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const P = PASSAGE_WORLD;
  const entryX = TABLE_RIGHT - 0.02;
  const exit = (dy: number) => [P.clone().add(new THREE.Vector3(0, dy, 0)), new THREE.Vector3(P.x - 0.02, P.y + dy, 0.05), new THREE.Vector3(entryX, P.y + dy, CAVITY_Z)];
  // DATA: cadeia DIN → DOUT em zigue-zague pelas linhas (ilustrativo)
  const data = exit(0);
  data.push(new THREE.Vector3(entryX, cellOrigin(18, 1).y + 0.03, CAVITY_Z));
  rows.forEach((r, ri) => {
    const els = ELEMENTS.filter((e) => e.row === r).sort((a, b) => a.col - b.col);
    if (ri % 2 === 0) els.reverse();
    const y = cellOrigin(1, r).y + 0.03;
    for (const e of els) data.push(new THREE.Vector3(modulePosition(e.col, e.row)[0], y, CAVITY_Z));
  });
  wires.push({ pts: data, color: COL.data, kind: 'data', r: 0.0022 });
  // 5 V e GND: barramento vertical atrás da coluna 18 e ramais por linha (ilustrativo)
  const ys = rows.map((r) => cellOrigin(1, r).y + 0.012);
  for (const [i, r] of rows.entries()) {
    const els = ELEMENTS.filter((e) => e.row === r);
    const x0 = cellOrigin(Math.min(...els.map((e) => e.col)), r).x - PITCH_X / 2 + 0.02;
    wires.push({ pts: [new THREE.Vector3(entryX, ys[i], CAVITY_Z), new THREE.Vector3(x0, ys[i], CAVITY_Z)], color: COL.v5, kind: 'power' });
    wires.push({ pts: [new THREE.Vector3(entryX - 0.012, ys[i] + 0.008, CAVITY_Z - 0.004), new THREE.Vector3(x0, ys[i] + 0.008, CAVITY_Z - 0.004)], color: COL.gnd, kind: 'power' });
  }
  const top = Math.max(...ys), bot = Math.min(...ys);
  wires.push({ pts: [...exit(-0.012), new THREE.Vector3(entryX, top, CAVITY_Z)], color: COL.v5, kind: 'power', r: 0.003 });
  wires.push({ pts: [new THREE.Vector3(entryX, P.y - 0.012, CAVITY_Z), new THREE.Vector3(entryX, bot, CAVITY_Z)], color: COL.v5, kind: 'power', r: 0.003 });
  wires.push({ pts: [...exit(0.012), new THREE.Vector3(entryX - 0.012, top + 0.008, CAVITY_Z - 0.004)], color: COL.gnd, kind: 'power', r: 0.003 });
  wires.push({ pts: [new THREE.Vector3(entryX - 0.012, P.y + 0.012, CAVITY_Z - 0.004), new THREE.Vector3(entryX - 0.012, bot + 0.008, CAVITY_Z - 0.004)], color: COL.gnd, kind: 'power', r: 0.003 });
  // botões → caixa técnica: sai pela traseira da caixa de controle, desce pela canaleta e
  // passa sob a tabela (trajeto ilustrativo)
  const chanY = TABLE_BOTTOM - 0.04;
  const bx = BUTTON_BOX.x + BUTTON_BOX.w / 2 - 0.02;
  wires.push({
    pts: [
      new THREE.Vector3(bx, BUTTON_BOX.y - BUTTON_BOX.h / 2 + 0.008, 0.006), new THREE.Vector3(bx, BUTTON_BOX.y - BUTTON_BOX.h / 2 - 0.02, 0.012),
      new THREE.Vector3(TABLE_LEFT + 0.01, chanY + 0.05, 0.012), new THREE.Vector3(TABLE_LEFT + 0.03, chanY, 0.012),
      new THREE.Vector3(TABLE_RIGHT + 0.03, chanY, 0.012), new THREE.Vector3(TABLE_RIGHT + 0.04, P.y - 0.06, 0.03), P.clone().add(new THREE.Vector3(0, 0.02, 0)),
    ],
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
    mat.uniforms.flow.value = (view === 'alimentacao' && w.kind === 'power') || (view === 'dados' && w.kind === 'data') ? 1 : 0;
    mat.uniforms.dim.value = (view === 'alimentacao' && w.kind !== 'power') || (view === 'dados' && w.kind !== 'data') ? 0.25 : 1;
  });
  return <mesh geometry={geo} material={mat} />;
}

const TAGS: Record<string, string> = { doc: 'documentado', est: 'estimado', ilu: 'ilustrativo', conf: 'a confirmar' };
function Label({ pos, text, tag }: { pos: THREE.Vector3 | [number, number, number]; text: string; tag: string }) {
  return (
    <Html position={pos} center distanceFactor={1.4} zIndexRange={[20, 0]}>
      <div className="e-label"><span className={`tag ${tag}`}>{TAGS[tag]}</span> {text}</div>
    </Html>
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
    ref.current.computeBoundingSphere();
    ref.current.userData.done = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, mats.length]}>
      <boxGeometry args={[0.012, 0.007, 0.008]} />
      <meshStandardMaterial color="#f2f2ee" roughness={0.4} />
    </instancedMesh>
  );
}

export function Electronics() {
  const view = useStore((s) => s.electronics);
  const showWiring = useStore((s) => s.showWiring);
  const inspect = useStore((s) => s.inspect);
  const wires = useMemo(buildWires, []);
  const open = view !== 'off' && view !== 'normal';
  const wiresVisible = open || showWiring;
  const T = TECH_COMPONENTS;
  const lbl = view === 'identificados' && inspect !== 'tecnica';
  const chanY = TABLE_BOTTOM - 0.04;
  const box = ELECTRONICS_BOX;

  return (
    <group>
      <TechBox />
      {wiresVisible && (
        <>
          {/* canaleta de PVC: da caixa de controle, descendo e passando sob a tabela (trajeto estimado) */}
          <mesh position={[(TABLE_LEFT + TABLE_RIGHT + 0.06) / 2, chanY, 0.012]}>
            <boxGeometry args={[TABLE_RIGHT - TABLE_LEFT + 0.06, 0.02, 0.016]} />
            <meshStandardMaterial color="#f3f3f1" roughness={0.6} transparent opacity={0.35} />
          </mesh>
          {wires.map((w, i) => <WireMesh key={i} w={w} view={view} />)}
          <Connectors />
        </>
      )}
      {lbl && (
        <group>
          <Label pos={techWorld(T.fonte.pos[0], T.fonte.pos[1], 140)} text="Fonte 24 V / 2 A" tag="doc" />
          <Label pos={techWorld(T.conversor5v.pos[0], T.conversor5v.pos[1], 150)} text="Conversão 24 V → 5 V" tag="conf" />
          <Label pos={techWorld(T.conversor12v.pos[0], T.conversor12v.pos[1] + 12, 150)} text="12 V do cooler" tag="conf" />
          <Label pos={techWorld(T.arduinos[0][0] + 40, T.arduinos[0][1] + 10, 150)} text={T.arduinos.length === 1 ? 'Arduino' : `Arduinos (${T.arduinos.length})`} tag="doc" />
          <Label pos={techWorld(T.disjuntor.pos[0], T.disjuntor.pos[1] - 15, 150)} text="Disjuntor — posição estimada" tag="est" />
          <Label pos={techWorld(T.chave.pos[0], T.chave.pos[1] - 8, 150)} text="Chave geral — posição estimada" tag="est" />
          <Label pos={techWorld(T.cooler.pos[0], 110, 63)} text="Cooler no furo Ø80 do tampo (SVG)" tag="doc" />
          <Label pos={techWorld(60, -105, 60)} text="Grade de entrada de ar (SVG)" tag="doc" />
          <Label pos={techWorld(175, 55, 60)} text="Grade de saída de ar (SVG)" tag="doc" />
          <Label pos={PASSAGE_WORLD.clone().add(new THREE.Vector3(-0.03, 0.05, 0.04))} text="Rasgo elíptico 92 × 64 mm — passagem de cabos (SVG)" tag="doc" />
          {view === 'identificados' && (
            <>
              <Label pos={[BUTTON_BOX.x, BUTTON_BOX.y - 0.07, 0.08]} text="Caixa de controle (4 botões)" tag="doc" />
              <Label pos={[0, chanY - 0.03, 0.05]} text="Canaleta PVC — cabos dos botões" tag="est" />
              <Label pos={[TABLE_RIGHT - 0.02, cellOrigin(18, 3).y, 0.06]} text="Barramento 5 V / GND" tag="ilu" />
              <Label pos={[0, cellOrigin(9, 1).y + 0.05, 0.06]} text="Cadeia DATA (DIN → DOUT)" tag="ilu" />
              <Label pos={[box.x, box.y + box.h / 2 + 0.05, 0.13]} text="Caixa técnica (caixa_arduino.svg)" tag="doc" />
            </>
          )}
        </group>
      )}
    </group>
  );
}
