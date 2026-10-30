/**
 * Geometria do módulo, reproduzindo os contornos de corte de caixa.svg e placa.svg
 * (encaixes "finger joint", rasgos e furos). Construída em milímetros e convertida
 * para metros. Sistema local do módulo: origem no centro da base da caixa,
 * y para cima, z para a frente (para fora da parede).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ACRYLIC, BOX, LED_STRIP, NAMEPLATE, MM } from '../data/construction';

const W = BOX.width, D = BOX.depth, H = BOX.height, T = BOX.mdf, N = BOX.topNotchDepth;
type Pt = [number, number];

function shapeFrom(points: Pt[]): THREE.Shape {
  const s = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
function rectHole(cx: number, cy: number, w: number, h: number): THREE.Path {
  const p = new THREE.Path();
  p.moveTo(cx - w / 2, cy - h / 2);
  p.lineTo(cx - w / 2, cy + h / 2);
  p.lineTo(cx + w / 2, cy + h / 2);
  p.lineTo(cx + w / 2, cy - h / 2);
  p.closePath();
  return p;
}
function circleHole(cx: number, cy: number, d: number): THREE.Path {
  const p = new THREE.Path();
  p.absarc(cx, cy, d / 2, 0, Math.PI * 2, true);
  return p;
}
function extrude(shape: THREE.Shape, depth = T, curveSegments = 10): THREE.ExtrudeGeometry {
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
}
function toMeters(g: THREE.BufferGeometry) {
  g.scale(MM, MM, MM);
  g.computeVertexNormals();
  return g;
}

/** Frente/traseira: 180,2 × 50,2 mm, 5 encaixes de 7,1 mm no topo e rasgos laterais para os dedos das laterais */
function wallFrontShape(): THREE.Shape {
  const pts: Pt[] = [[0, 0], [W, 0]];
  const fingersAsc = [...BOX.cornerFingers].sort((a, b) => b[0] - a[0]); // y crescente
  for (const [a, b] of fingersAsc) pts.push([W, H - b], [W - T, H - b], [W - T, H - a], [W, H - a]);
  pts.push([W, H]);
  for (const [a, b] of [...BOX.lidTabsLong].reverse()) pts.push([b, H], [b, H - N], [a, H - N], [a, H]);
  pts.push([0, H]);
  for (const [a, b] of BOX.cornerFingers) pts.push([0, H - a], [T, H - a], [T, H - b], [0, H - b]);
  return shapeFrom(pts);
}

/** Lateral: 100,2 × 50,2 mm, dedos de 3 mm nas pontas, 3 encaixes no topo e furo Ø10 mm */
function wallSideShape(): THREE.Shape {
  const pts: Pt[] = [[T, 0], [D - T, 0]];
  for (const [a, b] of [...BOX.cornerFingers].reverse()) pts.push([D - T, H - b], [D, H - b], [D, H - a], [D - T, H - a]);
  pts.push([D - T, H]);
  for (const [a, b] of [...BOX.lidTabsShort].reverse()) pts.push([b, H], [b, H - N], [a, H - N], [a, H]);
  pts.push([T, H]);
  for (const [a, b] of BOX.cornerFingers) pts.push([T, H - a], [0, H - a], [0, H - b], [T, H - b]);
  const s = shapeFrom(pts);
  s.holes.push(circleHole(15.1, H - 20.1, BOX.sideHoleDiameter));
  return s;
}

/** Tampo 180,2 × 100,2 mm com abas nos quatro lados */
function lidShape(kind: 'superior' | 'inferior'): THREE.Shape {
  const pts: Pt[] = [[T, T]];
  for (const [a, b] of BOX.lidTabsLong) pts.push([a, T], [a, 0], [b, 0], [b, T]);
  pts.push([W - T, T]);
  for (const [a, b] of BOX.lidTabsShort) pts.push([W - T, a], [W, a], [W, b], [W - T, b]);
  pts.push([W - T, D - T]);
  for (const [a, b] of [...BOX.lidTabsLong].reverse()) pts.push([b, D - T], [b, D], [a, D], [a, D - T]);
  pts.push([T, D - T]);
  for (const [a, b] of [...BOX.lidTabsShort].reverse()) pts.push([T, b], [0, b], [0, a], [T, a]);
  const s = shapeFrom(pts);
  const cx = W / 2, cy = D / 2;
  const sl = BOX.acrylicSlot;
  s.holes.push(rectHole(cx - sl.centerOffset, cy, sl.length, sl.width), rectHole(cx + sl.centerOffset, cy, sl.length, sl.width));
  if (kind === 'superior') s.holes.push(rectHole(cx, cy, BOX.ledSlot.length, BOX.ledSlot.width));
  else for (const sx of [-55, 55]) for (const dy of [-BOX.wireHolePitch, 0, BOX.wireHolePitch]) s.holes.push(circleHole(cx + sx, cy + dy, BOX.wireHoleDiameter));
  return s;
}

/** Placa de acrílico (placa.svg): 140 × 126 mm, pés de 10 × 6 mm nas extremidades */
function acrylicShape(): THREE.Shape {
  const w = ACRYLIC.width, h = ACRYLIC.height + ACRYLIC.legHeight, l = ACRYLIC.legHeight, lw = ACRYLIC.legWidth;
  return shapeFrom([[0, 0], [lw, 0], [lw, l], [w - lw, l], [w - lw, 0], [w, 0], [w, h], [0, h]]);
}

export const LID_Y = { superior: H - T, inferior: H - 2 * T - BOX.lidGap };

function build() {
  const front = toMeters(extrude(wallFrontShape()).translate(-W / 2, 0, D / 2 - T));
  const back = toMeters(extrude(wallFrontShape()).translate(-W / 2, 0, -D / 2));
  const sideR = toMeters(extrude(wallSideShape()).translate(-D / 2, 0, 0).rotateY(-Math.PI / 2).translate(W / 2, 0, 0));
  const sideL = toMeters(extrude(wallSideShape()).translate(-D / 2, 0, 0).rotateY(-Math.PI / 2).translate(-W / 2 + T, 0, 0));
  const lidTop = toMeters(extrude(lidShape('superior')).translate(-W / 2, -D / 2, 0).rotateX(-Math.PI / 2).translate(0, LID_Y.superior, 0));
  const lidBottom = toMeters(extrude(lidShape('inferior')).translate(-W / 2, -D / 2, 0).rotateX(-Math.PI / 2).translate(0, LID_Y.inferior, 0));
  const t = ACRYLIC.thickness;
  const acrylic = toMeters(extrude(acrylicShape(), t, 1).translate(-ACRYLIC.width / 2, -ACRYLIC.legHeight, -t / 2).translate(0, H, 0));

  // brilho das bordas do acrílico (topo e laterais)
  const e = 0.6;
  const edgeTop = new THREE.BoxGeometry(ACRYLIC.width + e, e, t + e).translate(0, H + ACRYLIC.height, 0);
  const edgeL = new THREE.BoxGeometry(e, ACRYLIC.height, t + e).translate(-ACRYLIC.width / 2, H + ACRYLIC.height / 2, 0);
  const edgeR = edgeL.clone().translate(ACRYLIC.width, 0, 0);
  const edgeBottom = new THREE.BoxGeometry(ACRYLIC.width - 2 * ACRYLIC.legWidth, e * 2, t + e).translate(0, H + e, 0);
  const edges = toMeters(mergeGeometries([edgeTop, edgeL, edgeR, edgeBottom])!);

  // fita LED: PCB branca + 5 LEDs 5050
  const stripLen = LED_STRIP.leds * LED_STRIP.pitch;
  const stripY = LID_Y.inferior + T;
  const strip = toMeters(new THREE.BoxGeometry(stripLen, 0.9, LED_STRIP.width).translate(0, stripY + 0.45, 0));
  const chip = toMeters(new THREE.BoxGeometry(5, 1.5, 5).translate(0, stripY + 0.9 + 0.75, 0));
  const chipOffsets = Array.from({ length: LED_STRIP.leds }, (_, i) => (i - (LED_STRIP.leds - 1) / 2) * LED_STRIP.pitch * MM);

  // plaquinha (placa com cantos arredondados)
  const pw = NAMEPLATE.width, ph = NAMEPLATE.height, r = 4;
  const ps = new THREE.Shape();
  ps.moveTo(-pw / 2 + r, -ph / 2);
  ps.lineTo(pw / 2 - r, -ph / 2);
  ps.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + r);
  ps.lineTo(pw / 2, ph / 2 - r);
  ps.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - r, ph / 2);
  ps.lineTo(-pw / 2 + r, ph / 2);
  ps.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - r);
  ps.lineTo(-pw / 2, -ph / 2 + r);
  ps.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + r, -ph / 2);
  const nameplate = toMeters(new THREE.ExtrudeGeometry(ps, { depth: NAMEPLATE.thickness, bevelEnabled: true, bevelSize: 0.4, bevelThickness: 0.4, bevelSegments: 2, curveSegments: 4 }).translate(0, H / 2, D / 2));
  const nameplateFace = new THREE.PlaneGeometry(pw * MM, ph * MM).translate(0, (H / 2) * MM, (D / 2 + NAMEPLATE.thickness + 0.5) * MM);

  // gravação: plano sobre a face frontal do acrílico (parte visível 140 × 120)
  const engraving = new THREE.PlaneGeometry(ACRYLIC.width * MM, ACRYLIC.height * MM).translate(0, (H + ACRYLIC.height / 2) * MM, (t / 2 + 0.15) * MM);
  const engravingBack = engraving.clone().translate(0, 0, -(t + 0.3) * MM);

  const braille = new THREE.SphereGeometry(0.75 * MM, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);

  return { front, back, sideL, sideR, lidTop, lidBottom, acrylic, edges, strip, chip, chipOffsets, nameplate, nameplateFace, engraving, engravingBack, braille };
}

let geo: ReturnType<typeof build> | null = null;
export function moduleGeometry() {
  if (!geo) geo = build();
  return geo;
}

/** Altura total do módulo (m) */
export const MODULE_HEIGHT = (H + ACRYLIC.height) * MM;
export const BOX_H = H * MM;
export const BOX_D = D * MM;
export const BOX_W = W * MM;
/** Posição z da face da plaquinha onde ficam os pontos braile */
export const BRAILLE_Z = (D / 2 + NAMEPLATE.thickness + 0.4) * MM;
export const BRAILLE_Y = (H / 2 - 4) * MM;
