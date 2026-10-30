import { useMemo } from 'react';
import * as THREE from 'three';
import { Center, Text3D } from '@react-three/drei';
import titleFont from '../assets/fonts/tinos-title.typeface.json';
import { mosaicTextures, stoneTexture } from '../lib/textures';
import { cellOrigin, PITCH_Y } from '../lib/layout';

const WALL_W = 14;
const WALL_H = 2.78;

/** Parede de pastilhas, viga de concreto, teto escuro e calçada de pedra portuguesa */
export function Room() {
  const { wall, bump, floor } = useMemo(() => {
    const { map, bump } = mosaicTextures();
    const w = map.clone(), b = bump.clone();
    const tileRepeat = 32 * 0.021; // 32 pastilhas de 2,1 cm por repetição
    w.repeat.set(WALL_W / tileRepeat, WALL_H / tileRepeat);
    b.repeat.copy(w.repeat);
    w.needsUpdate = b.needsUpdate = true;
    const f = stoneTexture().clone();
    f.repeat.set(WALL_W / 1.6, 8 / 1.6);
    f.needsUpdate = true;
    return { wall: w, bump: b, floor: f };
  }, []);
  return (
    <group>
      <mesh position={[0, WALL_H / 2, 0]} receiveShadow>
        <planeGeometry args={[WALL_W, WALL_H]} />
        <meshStandardMaterial map={wall} bumpMap={bump} bumpScale={0.6} roughness={0.42} metalness={0.02} />
      </mesh>
      {/* viga de concreto clara no topo da parede */}
      <mesh position={[0, WALL_H + 0.17, 0.08]} receiveShadow>
        <boxGeometry args={[WALL_W, 0.34, 0.16]} />
        <meshStandardMaterial color="#d8d6d0" roughness={0.9} />
      </mesh>
      <mesh position={[0, WALL_H + 0.34, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_W, 4]} />
        <meshStandardMaterial color="#26282a" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]} receiveShadow>
        <planeGeometry args={[WALL_W, 8]} />
        <meshStandardMaterial map={floor} roughness={0.85} />
      </mesh>
      {/* rodapé discreto na junção parede/piso */}
      <mesh position={[0, 0.01, 0.006]}>
        <boxGeometry args={[WALL_W, 0.02, 0.012]} />
        <meshStandardMaterial color="#3b302b" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Inscrição "Tabela Periódica" em letras metálicas serifadas acima da instalação */
export function Title() {
  const y = cellOrigin(1, 1).y + PITCH_Y * 0.62;
  return (
    <group position={[0, y, 0.012]}>
      <Center>
        <Text3D font={titleFont as never} size={0.2} height={0.018} curveSegments={6} bevelEnabled bevelSize={0.0025} bevelThickness={0.003} bevelSegments={2} letterSpacing={0.004} castShadow>
          Tabela  Periódica
          <meshStandardMaterial color="#d6d6d8" metalness={0.85} roughness={0.32} envMapIntensity={1.2} />
        </Text3D>
      </Center>
    </group>
  );
}
