/**
 * Caixa de controle (foto de detalhe): caixa de MDF claro entre a placa informativa
 * e a coluna 1, logo abaixo da plaquinha de créditos. Tampo superior plano e vazio;
 * quatro botões de arcade na FACE FRONTAL, na ordem vermelho–verde–amarelo–azul.
 * Medidas estimadas pela foto (ver src/data/controlBoxes.ts).
 */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { BUTTON_GROUPS, type ButtonGroup } from '../config/buttonGroups';
import { CONTROL_BOX, CONTROL_PARTS } from '../data/controlBoxes';
import { BUTTON_BOX } from '../lib/layout';
import { useStore } from '../state/store';
import { materials } from './materials';

const MM = 0.001;
const T = CONTROL_BOX.mdf * MM;
const { w: W, h: H, d: D } = BUTTON_BOX;
const PITCH = CONTROL_BOX.buttonPitch * MM;
const buttonX = (i: number) => (i - 1.5) * PITCH;

const damp = (cur: number, target: number, dt: number, tau = 0.2) =>
  useStore.getState().reducedMotion ? target : cur + (target - cur) * (1 - Math.exp(-dt / tau));

function ArcadeButton({ g, x }: { g: ButtonGroup; x: number }) {
  const plunger = useRef<THREE.Group>(null!);
  const press = useRef(0);
  const mats = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({ color: g.color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color(g.color), emissiveIntensity: 0 }),
      bezel: new THREE.MeshPhysicalMaterial({ color: '#f4f4f2', roughness: 0.22, clearcoat: 0.9 }),
      housing: new THREE.MeshStandardMaterial({ color: '#1d1d1f', roughness: 0.6 }),
      switch: new THREE.MeshStandardMaterial({ color: '#2b2b2e', roughness: 0.5 }),
      metal: new THREE.MeshStandardMaterial({ color: '#c9c9c9', metalness: 0.9, roughness: 0.3 }),
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
    // o êmbolo afunda até 4 mm ao pressionar; o ativo fica levemente rebaixado e iluminado
    plunger.current.position.y = 0.0062 - (0.004 * press.current + (active ? 0.0012 : 0));
    mats.body.emissiveIntensity = damp(mats.body.emissiveIntensity, active ? 0.6 : 0, dt, 0.08);
  });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const st = useStore.getState();
    st.pressGroup(g.id);
    st.say(`Botão ${g.label}: LEDs do grupo ${g.label} acesos; demais grupos apagados.`);
  };
  const bz = (CONTROL_BOX.bezelDiameter / 2) * MM, pz = (CONTROL_BOX.plungerDiameter / 2) * MM;
  return (
    // eixo do cilindro (y local) apontando para fora da face frontal (+z)
    <group position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => (document.body.style.cursor = '')}>
      {/* aro branco sobre a face */}
      <mesh material={mats.bezel} position={[0, 0.002, 0]} castShadow>
        <cylinderGeometry args={[bz * 0.96, bz, 0.004, 40]} />
      </mesh>
      <mesh material={mats.bezel} position={[0, 0.0042, 0]}>
        <torusGeometry args={[pz + 0.0015, 0.0012, 10, 40]} />
      </mesh>
      {/* êmbolo colorido com topo abaulado */}
      <group ref={plunger}>
        <mesh material={mats.body} position={[0, -0.003, 0]}>
          <cylinderGeometry args={[pz, pz, 0.01, 40]} />
        </mesh>
        <mesh material={mats.body} position={[0, 0.002, 0]} scale={[1, 0.3, 1]}>
          <sphereGeometry args={[pz, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      {/* corpo rosqueado, porca e microchave atrás da face (visíveis com a tampa aberta) */}
      <mesh material={mats.housing} position={[0, -0.016, 0]}>
        <cylinderGeometry args={[0.0135, 0.0135, 0.026, 24]} />
      </mesh>
      <mesh material={mats.housing} position={[0, -T - 0.004, 0]}>
        <cylinderGeometry args={[0.0175, 0.0175, 0.005, 6]} />
      </mesh>
      <mesh material={mats.switch} position={[0, -0.034, 0]}>
        <boxGeometry args={[0.02, 0.012, 0.01]} />
      </mesh>
      {[-0.005, 0.005].map((dx) => (
        <mesh key={dx} material={mats.metal} position={[dx, -0.042, 0]}>
          <boxGeometry args={[0.0028, 0.006, 0.0006]} />
        </mesh>
      ))}
    </group>
  );
}

/** Painel frontal com 4 furos para os botões */
function frontGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, -H / 2);
  s.lineTo(W / 2, -H / 2);
  s.lineTo(W / 2, H / 2);
  s.lineTo(-W / 2, H / 2);
  s.closePath();
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Path();
    p.absarc(buttonX(i), 0, (CONTROL_BOX.holeDiameter / 2) * MM, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  return new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, -T);
}

/** Marcas queimadas dos encaixes (finger joints) ao longo de uma aresta */
function Fingers({ length, axis, pos, step = CONTROL_BOX.fingerPitch * MM }: { length: number; axis: 'x' | 'y' | 'z'; pos: [number, number, number]; step?: number }) {
  const mat = materials().mdfEdge;
  const n = Math.max(2, Math.floor(length / step));
  const seg = length / n;
  return (
    <group position={pos}>
      {Array.from({ length: n }, (_, i) => i).filter((i) => i % 2 === 0).map((i) => {
        const c = -length / 2 + seg * (i + 0.5);
        const p: [number, number, number] = axis === 'x' ? [c, 0, 0] : axis === 'y' ? [0, c, 0] : [0, 0, c];
        const size: [number, number, number] = axis === 'x' ? [seg, 0.0007, 0.0007] : axis === 'y' ? [0.0007, seg, 0.0007] : [0.0007, 0.0007, seg];
        return <mesh key={i} position={p} material={mat}><boxGeometry args={size} /></mesh>;
      })}
    </group>
  );
}

export function ButtonBox() {
  const mat = materials();
  const front = useMemo(frontGeometry, []);
  const inspect = useStore((s) => s.inspect);
  const part = useStore((s) => s.inspectPart);
  const inspecting = inspect === 'botoes';
  const g = {
    front: useRef<THREE.Group>(null!), buttons: useRef<THREE.Group>(null!), lid: useRef<THREE.Group>(null!),
    base: useRef<THREE.Group>(null!), left: useRef<THREE.Group>(null!), right: useRef<THREE.Group>(null!), cables: useRef<THREE.Group>(null!),
  };
  const anim = useRef({ ex: 0, lid: 0, det: 0 });
  const highlight = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f0e8', roughness: 0.8, emissive: '#3b82f6', emissiveIntensity: 0.5 }), []);
  const cableMats = useMemo(() => ['#d62828', '#202020', '#2a9d3a', '#1f6fe0', '#f2c200'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 })), []);

  // cabos internos: de cada microchave até a saída traseira (presos às peças: acompanham a frente)
  const cables = useMemo(() => [0, 1, 2, 3].map((i) => {
    const pts = [
      new THREE.Vector3(buttonX(i), 0, -0.042), new THREE.Vector3(buttonX(i) * 0.8, -H / 2 + 0.012, -0.05),
      new THREE.Vector3(W / 2 - 0.03, -H / 2 + 0.01, -D + 0.02), new THREE.Vector3(W / 2 - 0.02, -H / 2 + 0.008, -D + 0.004),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0012, 6, false);
  }), []);

  useFrame((_, dt) => {
    const s = useStore.getState();
    const on = s.inspect === 'botoes';
    const a = anim.current;
    a.ex = damp(a.ex, on && s.inspectExploded ? 1 : 0, dt, 0.25);
    a.lid = damp(a.lid, on && s.inspectOpen ? 1 : 0, dt, 0.25);
    a.det = damp(a.det, on && s.buttonsDetached ? 1 : 0, dt, 0.25);
    // frente (com botões e cabos presos) avança; tampo sobe; fundo desce; laterais se afastam
    g.front.current.position.z = D + a.ex * 0.09;
    g.buttons.current.position.z = a.det * 0.07;
    g.cables.current.visible = a.det < 0.05;
    g.lid.current.position.y = H / 2 + a.ex * 0.07;
    g.lid.current.rotation.x = -a.lid * 1.35; // dobradiça na aresta traseira (≈ 77°, sem invadir a parede)
    g.base.current.position.y = -a.ex * 0.06;
    g.left.current.position.x = -a.ex * 0.06;
    g.right.current.position.x = a.ex * 0.06;
  });

  const pick = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    const st = useStore.getState();
    if (st.inspect !== 'botoes') return st.openInspect('botoes');
    const p = CONTROL_PARTS.find((x) => x.id === id)!;
    useStore.setState({ inspectPart: id });
    st.say(`${p.name}. ${p.role}`);
  };
  const m = (id: string) => (inspecting && part === id ? highlight : mat.mdfFace);
  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
  const out = () => (document.body.style.cursor = '');

  return (
    // origem: centro da caixa no plano da parede; frente em z = D
    <group position={[BUTTON_BOX.x, BUTTON_BOX.y, 0]} onPointerOver={over} onPointerOut={out}>
      <group ref={g.front} position={[0, 0, D]}>
        <mesh geometry={front} material={m('frente')} castShadow receiveShadow onClick={pick('frente')} />
        <Fingers length={W} axis="x" pos={[0, H / 2 - 0.0004, 0.0002]} />
        <Fingers length={W} axis="x" pos={[0, -H / 2 + 0.0004, 0.0002]} />
        <Fingers length={H} axis="y" pos={[-W / 2 + 0.0004, 0, 0.0002]} step={0.012} />
        <Fingers length={H} axis="y" pos={[W / 2 - 0.0004, 0, 0.0002]} step={0.012} />
        <group ref={g.buttons}>
          {BUTTON_GROUPS.map((b, i) => <ArcadeButton key={b.id} g={b} x={buttonX(i)} />)}
        </group>
        <group ref={g.cables}>
          {cables.map((c, i) => <mesh key={i} geometry={c} material={cableMats[i]} onClick={pick('cabos')} />)}
        </group>
      </group>
      {/* tampo superior: prateleira plana e vazia (dobradiça virtual na aresta traseira) */}
      <group ref={g.lid} position={[0, H / 2, 0.0005]}>
        <mesh position={[0, -T / 2, (D - T) / 2]} material={m('tampo')} castShadow receiveShadow onClick={pick('tampo')}>
          <boxGeometry args={[W, T, D - T - 0.001]} />
        </mesh>
        <Fingers length={D - T} axis="z" pos={[-W / 2 + 0.0004, 0.0002, (D - T) / 2]} step={0.013} />
        <Fingers length={D - T} axis="z" pos={[W / 2 - 0.0004, 0.0002, (D - T) / 2]} step={0.013} />
      </group>
      <group ref={g.base}>
        <mesh position={[0, -H / 2 + T / 2, (D - T) / 2]} material={m('base')} receiveShadow onClick={pick('base')}>
          <boxGeometry args={[W - 2 * T, T, D - T - 0.001]} />
        </mesh>
      </group>
      {([['left', -1], ['right', 1]] as const).map(([k, sx]) => (
        <group key={k} ref={g[k]}>
          <mesh position={[sx * (W / 2 - T / 2), 0, (D - T) / 2]} material={m('laterais')} castShadow onClick={pick('laterais')}>
            <boxGeometry args={[T, H - 2 * T, D - T - 0.001]} />
          </mesh>
          <Fingers length={H} axis="y" pos={[sx * (W / 2 + 0.0002), 0, D - 0.008]} step={0.012} />
        </group>
      ))}
      {inspecting && (
        <Html position={[0, -H / 2 - 0.03, D + 0.01]} center distanceFactor={0.45} zIndexRange={[20, 0]}>
          <div className="btn-legend" aria-hidden>
            {BUTTON_GROUPS.map((b) => (
              <span key={b.id}><i style={{ background: b.color }} />{b.label}</span>
            ))}
            <small>legenda da simulação — a caixa real não tem inscrições</small>
          </div>
        </Html>
      )}
    </group>
  );
}
