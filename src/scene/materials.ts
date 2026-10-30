import * as THREE from 'three';
import { burntTexture, glowTexture, mdfTexture } from '../lib/textures';

let mats: ReturnType<typeof build> | null = null;

function build() {
  const mdfMap = mdfTexture().clone();
  mdfMap.repeat.set(1 / 90, 1 / 90);
  mdfMap.needsUpdate = true;
  const burnt = burntTexture().clone();
  burnt.repeat.set(1 / 6, 1 / 6);
  burnt.needsUpdate = true;
  // ExtrudeGeometry: grupo 0 = faces (MDF branco), grupo 1 = bordas cortadas a laser (queimadas)
  const mdfFace = new THREE.MeshStandardMaterial({ map: mdfMap, color: '#f4f0e8', roughness: 0.82, metalness: 0 });
  const mdfEdge = new THREE.MeshStandardMaterial({ map: burnt, color: '#5a4636', roughness: 0.95 });
  const niche = new THREE.MeshStandardMaterial({ map: mdfMap, color: '#d9d6d0', roughness: 0.85 });
  const nicheBack = new THREE.MeshStandardMaterial({ map: mdfMap, color: '#2c2b28', roughness: 0.95 });
  const acrylic = new THREE.MeshPhysicalMaterial({
    color: '#eef8f6', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.49, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide,
  });
  const edgeGlow = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const ledGlow = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const spill = new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#ffffff', toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const strip = new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.5 });
  const chip = new THREE.MeshStandardMaterial({ color: '#fff8e0', roughness: 0.3, emissive: '#000000' });
  const nameplate = new THREE.MeshStandardMaterial({ color: '#f7f7f5', roughness: 0.45 });
  const braille = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, transmission: 0, transparent: true, opacity: 0.85, clearcoat: 1 });
  return { mdf: [mdfFace, mdfEdge], mdfFace, mdfEdge, niche, nicheBack, acrylic, edgeGlow, ledGlow, spill, strip, chip, nameplate, braille };
}

export function materials() {
  if (!mats) mats = build();
  return mats;
}

/**
 * Material da gravação a laser no acrílico.
 * Desligado: traço jateado esbranquiçado. Ligado: os traços espalham a luz do LED
 * (cor do grupo) com halo suave e um gradiente que nasce na borda inferior,
 * onde a luz entra pela fenda do tampo.
 */
export function createEngravingMaterial(map: THREE.Texture | null, ghost = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      hasMap: { value: map ? 1 : 0 },
      ledColor: { value: new THREE.Color(0, 1, 0.2) },
      intensity: { value: 0 },
      ghost: { value: ghost },
      highlight: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float hasMap; uniform vec3 ledColor; uniform float intensity; uniform float ghost; uniform float highlight;
      varying vec2 vUv;
      void main() {
        vec2 t = hasMap > 0.5 ? texture2D(map, vUv).rg : vec2(0.0);
        float crisp = t.r, halo = t.g;
        float I = intensity;
        vec3 frost = vec3(0.62, 0.66, 0.66);
        vec3 lit = ledColor * (2.2 + 1.2 * crisp);
        vec3 col = crisp * mix(frost, lit, clamp(I, 0.0, 1.0)) * (0.4 + 0.6 * max(I, 0.25));
        col += halo * ledColor * 0.9 * I;
        // luz que entra pela borda inferior e se espalha no corpo da placa
        float body = pow(1.0 - vUv.y, 3.0) * 0.10 + 0.012;
        float edge = smoothstep(0.03, 0.0, min(min(vUv.x, 1.0 - vUv.x), 1.0 - vUv.y)) * 0.25;
        col += ledColor * I * (body + edge);
        col += vec3(0.6, 0.9, 1.0) * highlight * 0.04;
        float a = clamp(crisp * (0.55 + 0.45 * I) + halo * 0.35 * I, 0.0, 1.0);
        gl_FragColor = vec4(col * ghost, a * ghost);
      }
    `,
  });
}
