import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { Room, Title } from './Room';
import { TableModules } from './TableModules';
import { SelectedModule } from './SelectedModule';
import { ButtonBox } from './ButtonBox';
import { CameraRig, HOME } from './CameraRig';
import { Highlights } from './Highlight';
import { InfoBoard } from './InfoBoard';
import { Electronics } from './Electronics';
import { Labels } from './Labels';

function Lights({ shadows }: { shadows: boolean }) {
  return (
    <>
      <hemisphereLight args={['#f4f1ea', '#5d5a55', 0.75]} />
      <ambientLight intensity={0.12} />
      <directionalLight
        position={[-1.8, 4.2, 4.5]}
        intensity={1.35}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.01}
        shadow-camera-left={-3.4}
        shadow-camera-right={3.4}
        shadow-camera-top={2.4}
        shadow-camera-bottom={-1.4}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        target-position={[0, 1.1, 0]}
      />
      <directionalLight position={[3, 2, 3]} intensity={0.25} />
    </>
  );
}

export function Scene() {
  const quality = useStore((s) => s.quality);
  const [dpr, setDpr] = useState(1.5);
  const high = quality === 'alta';
  return (
    <Canvas
      shadows={high ? 'soft' : false}
      dpr={[1, high ? dpr : 1]}
      camera={{ position: [HOME.pos[0], HOME.pos[1], HOME.pos[2]], fov: 42, near: 0.02, far: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      onPointerMissed={() => useStore.setState({ hovered: null })}
      onCreated={(st) => { if (import.meta.env.DEV || window.location.search.includes('debug')) (window as unknown as { __three: unknown }).__three = st; }}
    >
      <color attach="background" args={['#1b1c1e']} />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <Lights shadows={high} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 2, 1]} form="rect" />
        <Lightformer intensity={0.8} position={[-5, 2, 2]} scale={[2, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer intensity={0.6} position={[5, 2, 2]} scale={[2, 4, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer intensity={0.3} position={[0, 1, -3]} scale={[8, 3, 1]} color="#8a6a5c" />
      </Environment>
      <Suspense fallback={null}>
        <Room />
        <Title />
        <InfoBoard />
        <ButtonBox />
      </Suspense>
      <TableModules />
      <SelectedModule />
      <Highlights />
      <Electronics />
      <Labels />
      <CameraRig />
      <EffectComposer multisampling={high ? 4 : 0}>
        <Bloom mipmapBlur luminanceThreshold={0.95} luminanceSmoothing={0.2} intensity={high ? 0.85 : 0.6} radius={0.65} />
        <Vignette offset={0.3} darkness={0.45} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
