/**
 * Os 118 módulos + 2 marcadores das séries f montados na estrutura de nichos.
 * Peças repetidas usam InstancedMesh (uma chamada de desenho por tipo de peça);
 * só a gravação e a plaquinha, que têm textura própria, são malhas individuais.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENTS } from '../data/elements';
import { SLOTS, cellOrigin, modulePosition, PITCH_X, PITCH_Y, NICHE_DEPTH, WALL_T, NICHE_BACK_Z } from '../lib/layout';
import { brailleDotPositions, brailleWidth } from '../lib/braille';
import { placeholderTexture } from '../lib/textures';
import { ACRYLIC, MM } from '../data/construction';
import { useStore } from '../state/store';
import { moduleGeometry, BRAILLE_Y, BRAILLE_Z, BOX_H, BOX_D } from './moduleGeometry';
import { createEngravingMaterial, materials } from './materials';
import { ledColor, ledLevel, stepLeds } from './ledRuntime';
import { useElementTextures } from './useElementTextures';

const N = 118;
const tmpM = new THREE.Matrix4();
const tmpC = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

function nicheGeometries() {
  const d = NICHE_DEPTH, t = WALL_T, zc = NICHE_BACK_Z + t + d / 2;
  const frame = [
    new THREE.BoxGeometry(PITCH_X, t, d).translate(0, PITCH_Y - t / 2, zc),
    new THREE.BoxGeometry(PITCH_X, t, d).translate(0, t / 2, zc),
    new THREE.BoxGeometry(t, PITCH_Y, d).translate(-PITCH_X / 2 + t / 2, PITCH_Y / 2, zc),
    new THREE.BoxGeometry(t, PITCH_Y, d).translate(PITCH_X / 2 - t / 2, PITCH_Y / 2, zc),
  ];
  // mesclar mantendo a mesma ordem de atributos
  const merged = new THREE.BufferGeometry();
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  let off = 0;
  for (const g of frame) {
    pos.push(...(g.attributes.position.array as Float32Array));
    nor.push(...(g.attributes.normal.array as Float32Array));
    uv.push(...Array.from(g.attributes.uv.array as Float32Array).map((v) => v * 120));
    idx.push(...Array.from(g.index!.array).map((v) => v + off));
    off += g.attributes.position.count;
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  merged.setIndex(idx);
  const back = new THREE.BoxGeometry(PITCH_X, PITCH_Y, t).translate(0, PITCH_Y / 2, NICHE_BACK_Z + t / 2);
  return { frame: merged, back };
}

/** Plano de luz espalhada no fundo do nicho, no espaço local do módulo */
function spillGeometry() {
  const moduleZ = modulePosition(1, 1)[2];
  const backZ = NICHE_BACK_Z + WALL_T + 0.002 - moduleZ;
  const back = new THREE.PlaneGeometry(0.2, 0.2).translate(0, BOX_H + 0.07, backZ);
  const lid = new THREE.PlaneGeometry(0.16, 0.07).rotateX(-Math.PI / 2).translate(0, BOX_H + 0.0008, 0);
  const g = new THREE.BufferGeometry();
  const a = back.toNonIndexed(), b = lid.toNonIndexed();
  for (const name of ['position', 'normal', 'uv'] as const) {
    const arrA = a.attributes[name].array as Float32Array, arrB = b.attributes[name].array as Float32Array;
    const arr = new Float32Array(arrA.length + arrB.length);
    arr.set(arrA);
    arr.set(arrB, arrA.length);
    g.setAttribute(name, new THREE.BufferAttribute(arr, a.attributes[name].itemSize));
  }
  return g;
}

export function TableModules() {
  const geo = moduleGeometry();
  const mat = materials();
  const niche = useMemo(nicheGeometries, []);
  const spillGeo = useMemo(spillGeometry, []);
  const textures = useElementTextures();
  const select = useStore((s) => s.select);
  const selected = useStore((s) => s.selected);
  const phase = useStore((s) => s.phase);
  const electronics = useStore((s) => s.electronics);

  const refs = {
    frame: useRef<THREE.InstancedMesh>(null!), back: useRef<THREE.InstancedMesh>(null!),
    front: useRef<THREE.InstancedMesh>(null!), backWall: useRef<THREE.InstancedMesh>(null!),
    sideL: useRef<THREE.InstancedMesh>(null!), sideR: useRef<THREE.InstancedMesh>(null!),
    lid: useRef<THREE.InstancedMesh>(null!), acrylic: useRef<THREE.InstancedMesh>(null!),
    edges: useRef<THREE.InstancedMesh>(null!), strip: useRef<THREE.InstancedMesh>(null!),
    chips: useRef<THREE.InstancedMesh>(null!), spill: useRef<THREE.InstancedMesh>(null!),
    plate: useRef<THREE.InstancedMesh>(null!), braille: useRef<THREE.InstancedMesh>(null!),
  };
  const layer = { niches: useRef<THREE.Group>(null!), bases: useRef<THREE.Group>(null!), plates: useRef<THREE.Group>(null!) };
  const engravingMats = useMemo(() => ELEMENTS.map(() => createEngravingMaterial(null)), []);
  const plateTextMats = useMemo(
    () => ELEMENTS.map(() => new THREE.MeshStandardMaterial({ color: '#141414', transparent: true, roughness: 0.6, bumpScale: 1.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })),
    [],
  );
  const engravingMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const plateMeshes = useRef<(THREE.Mesh | null)[]>([]);

  // pontos braile de todas as plaquinhas em uma única InstancedMesh
  const braille = useMemo(() => {
    const ranges: [number, number][] = [];
    const mats: THREE.Matrix4[] = [];
    ELEMENTS.forEach((e) => {
      const [x, y, z] = modulePosition(e.col, e.row);
      const w = brailleWidth(e.name);
      const start = mats.length;
      for (const d of brailleDotPositions(e.name)) {
        mats.push(new THREE.Matrix4().makeTranslation(x + (d.x - w / 2) * MM, y + BRAILLE_Y + (2.5 - d.y) * MM, z + BRAILLE_Z));
      }
      ranges.push([start, mats.length]);
    });
    return { ranges, mats };
  }, []);

  // matrizes iniciais
  useLayoutEffect(() => {
    SLOTS.forEach((s) => {
      const o = cellOrigin(s.col, s.row);
      tmpM.makeTranslation(o.x, o.y, 0);
      refs.frame.current.setMatrixAt(s.index, tmpM);
      refs.back.current.setMatrixAt(s.index, tmpM);
    });
    refs.frame.current.instanceMatrix.needsUpdate = true;
    refs.back.current.instanceMatrix.needsUpdate = true;
    braille.mats.forEach((m, i) => refs.braille.current.setMatrixAt(i, m));
    refs.braille.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < N; i++) {
      for (let k = 0; k < 5; k++) refs.chips.current.setColorAt(i * 5 + k, tmpC.setRGB(0, 0, 0));
      refs.edges.current.setColorAt(i, tmpC.setRGB(0, 0, 0));
      refs.spill.current.setColorAt(i, tmpC.setRGB(0, 0, 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // posicionamento dos módulos (o selecionado é escondido: o SelectedModule assume)
  useLayoutEffect(() => {
    const hidden = phase !== 'none' ? selected : null;
    const moduleMeshes = [refs.front, refs.backWall, refs.sideL, refs.sideR, refs.lid, refs.acrylic, refs.edges, refs.strip, refs.spill, refs.plate];
    ELEMENTS.forEach((e, i) => {
      const [x, y, z] = modulePosition(e.col, e.row);
      const m = hidden === e.number ? ZERO : tmpM.makeTranslation(x, y, z);
      for (const r of moduleMeshes) r.current.setMatrixAt(i, m);
      for (let k = 0; k < 5; k++) {
        const mk = hidden === e.number ? ZERO : new THREE.Matrix4().makeTranslation(x + geo.chipOffsets[k], y, z);
        refs.chips.current.setMatrixAt(i * 5 + k, mk);
      }
      const [a, b] = braille.ranges[i];
      for (let j = a; j < b; j++) refs.braille.current.setMatrixAt(j, hidden === e.number ? ZERO : braille.mats[j]);
      const em = engravingMeshes.current[i];
      if (em) em.visible = hidden !== e.number;
      const pm = plateMeshes.current[i];
      if (pm) pm.visible = hidden !== e.number;
    });
    for (const r of [...moduleMeshes, refs.chips, refs.braille]) {
      r.current.instanceMatrix.needsUpdate = true;
      r.current.computeBoundingSphere();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, phase]);

  // aplica as texturas conforme ficam prontas
  useEffect(() => {
    textures.forEach((t, i) => {
      if (!t) return;
      const m = engravingMats[i];
      if (m.uniforms.map.value !== t.engraving) {
        m.uniforms.map.value = t.engraving;
        m.uniforms.hasMap.value = 1;
      }
      const p = plateTextMats[i];
      if (p.alphaMap !== t.nameplate) {
        p.alphaMap = t.nameplate;
        p.bumpMap = t.nameplate;
        p.needsUpdate = true;
      }
    });
  });

  // modo de eletrônica: estrutura translúcida para revelar a fiação
  useEffect(() => {
    const ghost = electronics !== 'off' && electronics !== 'normal' && electronics !== 'explodido';
    for (const m of [mat.niche, mat.nicheBack, mat.mdfFace, mat.mdfEdge, mat.nameplate]) {
      m.transparent = ghost;
      m.opacity = ghost ? 0.22 : 1;
      m.depthWrite = !ghost;
      m.needsUpdate = true;
    }
  }, [electronics, mat]);

  const explodeRef = useRef(0);
  useFrame((_, dt) => {
    const st = useStore.getState();
    const changed = stepLeds(Math.min(dt, 0.1), false);
    if (changed.length) {
      for (const i of changed) {
        const l = ledLevel[i];
        const c = ledColor[i];
        engravingMats[i].uniforms.intensity.value = l;
        engravingMats[i].uniforms.ledColor.value.copy(c);
        refs.edges.current.setColorAt(i, tmpC.copy(c).multiplyScalar(l * 1.6));
        refs.spill.current.setColorAt(i, tmpC.copy(c).multiplyScalar(l * 0.22));
        for (let k = 0; k < 5; k++) refs.chips.current.setColorAt(i * 5 + k, tmpC.copy(c).multiplyScalar(l * 4));
      }
      refs.edges.current.instanceColor!.needsUpdate = true;
      refs.spill.current.instanceColor!.needsUpdate = true;
      refs.chips.current.instanceColor!.needsUpdate = true;
    }
    // vista explodida do sistema completo (camadas se afastam da parede)
    const target = st.electronics === 'explodido' ? 1 : 0;
    const k = st.reducedMotion ? 1 : 1 - Math.exp(-dt / 0.25);
    explodeRef.current += (target - explodeRef.current) * k;
    const e = explodeRef.current;
    layer.niches.current.position.z = e * 0.25;
    layer.bases.current.position.z = e * 0.6;
    layer.plates.current.position.z = e * 0.95;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    const idx = (e.object.userData.index as number | undefined) ?? e.instanceId;
    if (idx === undefined || idx >= N) return;
    e.stopPropagation();
    select(idx + 1);
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const idx = (e.object.userData.index as number | undefined) ?? e.instanceId;
    if (idx === undefined || idx >= N) return;
    e.stopPropagation();
    if (useStore.getState().hovered !== idx + 1) useStore.setState({ hovered: idx + 1 });
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    useStore.setState({ hovered: null });
    document.body.style.cursor = '';
  };

  const plateTextGeo = geo.nameplateFace;
  return (
    <group onClick={onClick} onPointerMove={onMove} onPointerOut={onOut}>
      <group ref={layer.niches}>
        <instancedMesh ref={refs.frame} args={[niche.frame, mat.niche, SLOTS.length]} castShadow receiveShadow />
        <instancedMesh ref={refs.back} args={[niche.back, mat.nicheBack, SLOTS.length]} receiveShadow />
        {SLOTS.filter((s) => s.z === null).map((s) => {
          const o = cellOrigin(s.col, s.row);
          return (
            <mesh key={s.index} position={[o.x, o.y + PITCH_Y / 2, NICHE_BACK_Z + WALL_T + NICHE_DEPTH * 0.55]}>
              <planeGeometry args={[PITCH_X - 0.012, PITCH_Y - 0.012]} />
              <meshStandardMaterial key={textures[0] ? 'ok' : 'wait'} map={textures[0] ? placeholderTexture(s.label!) : null} color={textures[0] ? '#ffffff' : '#121212'} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
      <group ref={layer.bases}>
        <instancedMesh ref={refs.front} args={[geo.front, mat.mdf, N]} castShadow receiveShadow />
        <instancedMesh ref={refs.backWall} args={[geo.back, mat.mdf, N]} />
        <instancedMesh ref={refs.sideL} args={[geo.sideL, mat.mdf, N]} castShadow />
        <instancedMesh ref={refs.sideR} args={[geo.sideR, mat.mdf, N]} castShadow />
        <instancedMesh ref={refs.lid} args={[geo.lidTop, mat.mdf, N]} receiveShadow />
        <instancedMesh ref={refs.strip} args={[geo.strip, mat.strip, N]} />
        <instancedMesh ref={refs.chips} args={[geo.chip, mat.ledGlow, N * 5]} />
        <instancedMesh ref={refs.spill} args={[spillGeo, mat.spill, N]} renderOrder={2} />
        <instancedMesh ref={refs.plate} args={[geo.nameplate, mat.nameplate, N]} castShadow />
        <instancedMesh ref={refs.braille} args={[geo.braille, mat.braille, braille.mats.length]} />
        {ELEMENTS.map((e, i) => (
          <mesh
            key={e.number}
            ref={(m) => void (plateMeshes.current[i] = m)}
            geometry={plateTextGeo}
            material={plateTextMats[i]}
            position={modulePosition(e.col, e.row)}
            userData={{ index: i }}
          />
        ))}
      </group>
      <group ref={layer.plates}>
        <instancedMesh ref={refs.acrylic} args={[geo.acrylic, mat.acrylic, N]} renderOrder={3} />
        <instancedMesh ref={refs.edges} args={[geo.edges, mat.edgeGlow, N]} renderOrder={4} />
        {ELEMENTS.map((e, i) => (
          <mesh
            key={e.number}
            ref={(m) => void (engravingMeshes.current[i] = m)}
            geometry={geo.engraving}
            material={engravingMats[i]}
            position={modulePosition(e.col, e.row)}
            renderOrder={5}
            userData={{ index: i }}
          />
        ))}
      </group>
    </group>
  );
}

/** Altura útil para câmera: centro da placa de acrílico de um elemento */
export function plateCenter(z: number): THREE.Vector3 {
  const e = ELEMENTS[z - 1];
  const [x, y, zz] = modulePosition(e.col, e.row);
  return new THREE.Vector3(x, y + BOX_H + (ACRYLIC.height * MM) / 2 - 0.02, zz + BOX_D / 2);
}
