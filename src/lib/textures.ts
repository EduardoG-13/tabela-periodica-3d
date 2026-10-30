/**
 * Texturas procedurais geradas em canvas (sem downloads externos).
 * Gravações do acrílico e plaquinhas usam texturas RG8 (2 bytes/pixel) para
 * caber na memória de GPUs modestas: R = traço nítido, G = halo de dispersão.
 */
import * as THREE from 'three';
import '@fontsource/tinos/400.css';
import '@fontsource/tinos/700.css';
import '@fontsource/arimo/400.css';
import '@fontsource/arimo/700.css';
import type { ChemicalElement } from '../data/elements';
import { ACRYLIC, ENGRAVING, NAMEPLATE } from '../data/construction';
import { configTokens, massLabel } from './format';

export const SERIF = '"Tinos", "Times New Roman", serif';
export const SANS = '"Arimo", Arial, Helvetica, sans-serif';

let fontsReady: Promise<void> | null = null;
export function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load(`400 64px ${SERIF}`, 'Alumínio 13'),
      document.fonts.load(`700 64px ${SANS}`, 'Hidrogênio'),
      document.fonts.load(`400 64px ${SANS}`, 'Tabela'),
      document.fonts.load(`700 64px ${SERIF}`, 'Tabela'),
    ]).then(() => undefined).catch(() => undefined);
  }
  return fontsReady;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d', { willReadFrequently: true })!] as const;
}

/** Converte dois desenhos (nítido/halo) em DataTexture RG, invertendo as linhas (flipY manual). */
function toRG(crisp: ImageData, halo: ImageData | null): THREE.DataTexture {
  const { width: w, height: h } = crisp;
  const data = new Uint8Array(w * h * 2);
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w * 4;
    const dst = y * w * 2;
    for (let x = 0; x < w; x++) {
      data[dst + x * 2] = crisp.data[src + x * 4 + 3];
      data[dst + x * 2 + 1] = halo ? halo.data[src + x * 4 + 3] : crisp.data[src + x * 4 + 3];
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGFormat, THREE.UnsignedByteType);
  t.unpackAlignment = 1;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function drawEngraving(ctx: CanvasRenderingContext2D, el: ChemicalElement, s: number) {
  const W = ACRYLIC.width;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  const cap = 0.662; // altura de maiúscula da Tinos (em)
  const font = (h: number) => `400 ${(h / cap) * s}px ${SERIF}`;
  const fit = (text: string, h: number, maxW: number) => {
    ctx.font = font(h);
    const w = ctx.measureText(text).width;
    if (w > maxW * s) ctx.font = font((h * maxW * s) / w);
  };
  const E = ENGRAVING;
  // número atômico (canto superior esquerdo)
  ctx.textAlign = 'left';
  ctx.font = font(E.number.h);
  ctx.fillText(String(el.number), E.number.x * s, (E.number.top + E.number.h) * s);
  // configuração eletrônica (canto superior direito) com sobrescritos reais
  const tokens = configTokens(el.config);
  let ch = E.config.h;
  const measure = (h: number) => {
    let w = 0;
    for (const t of tokens) {
      ctx.font = font(h);
      w += ctx.measureText(t.base).width;
      ctx.font = font(h * 0.62);
      w += ctx.measureText(t.sup).width + h * 0.08 * s;
    }
    return w;
  };
  const maxW = E.config.right - 26;
  if (measure(ch) > maxW * s) ch = (ch * maxW * s) / measure(ch);
  let x = E.config.right * s - measure(ch);
  const base = (E.config.top + E.config.h) * s;
  for (const t of tokens) {
    ctx.font = font(ch);
    ctx.fillText(t.base, x, base);
    x += ctx.measureText(t.base).width;
    ctx.font = font(ch * 0.62);
    ctx.fillText(t.sup, x, base - ch * 0.55 * s);
    x += ctx.measureText(t.sup).width + ch * 0.08 * s;
  }
  // símbolo, nome e massa centralizados
  ctx.textAlign = 'center';
  fit(el.symbol, E.symbol.h, 120);
  ctx.fillText(el.symbol, (W / 2) * s, (E.symbol.top + E.symbol.h) * s);
  fit(el.name, E.name.h, 130);
  ctx.fillText(el.name, (W / 2) * s, (E.name.top + E.name.h) * s);
  fit(massLabel(el), E.mass.h, 120);
  ctx.fillText(massLabel(el), (W / 2) * s, (E.mass.top + E.mass.h) * s);
}

/** Textura da gravação do acrílico (proporção 140 × 120 mm da placa.svg) */
export function makeEngravingTexture(el: ChemicalElement, width = 512): THREE.DataTexture {
  const s = width / ACRYLIC.width;
  const h = Math.round(ACRYLIC.height * s);
  const [, ctx] = canvas(width, h);
  ctx.save();
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = s * 2.6;
  drawEngraving(ctx, el, s);
  ctx.restore();
  const halo = ctx.getImageData(0, 0, width, h);
  ctx.clearRect(0, 0, width, h);
  drawEngraving(ctx, el, s);
  const crisp = ctx.getImageData(0, 0, width, h);
  return toRG(crisp, halo);
}

/** Texto em alto-relevo da plaquinha (R = relevo, G = máscara) */
export function makeNameplateTexture(el: ChemicalElement, width = 512): THREE.DataTexture {
  const s = width / NAMEPLATE.width;
  const h = Math.round(NAMEPLATE.height * s);
  const [, ctx] = canvas(width, h);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let size = (15 / 0.716) * s;
  ctx.font = `700 ${size}px ${SANS}`;
  const w = ctx.measureText(el.name).width;
  if (w > 124 * s) size *= (124 * s) / w;
  ctx.font = `700 ${size}px ${SANS}`;
  ctx.fillText(el.name, (NAMEPLATE.width / 2) * s, (NAMEPLATE.height / 2 + 7.5) * s);
  const img = ctx.getImageData(0, 0, width, h);
  return toRG(img, null);
}

const cache = new Map<string, THREE.Texture>();
function cached<T extends THREE.Texture>(key: string, make: () => T): T {
  let t = cache.get(key) as T | undefined;
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** MDF branco com leve textura de fibras */
export function mdfTexture(): THREE.CanvasTexture {
  return cached('mdf', () => {
    const [c, ctx] = canvas(256, 256);
    const r = seeded(7);
    ctx.fillStyle = '#ebe6dc';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 200 + Math.floor(r() * 50);
      ctx.fillStyle = `rgba(${v},${v - 6},${v - 16},0.25)`;
      ctx.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

/** Borda queimada pelo corte a laser */
export function burntTexture(): THREE.CanvasTexture {
  return cached('burnt', () => {
    const [c, ctx] = canvas(64, 64);
    const r = seeded(3);
    ctx.fillStyle = '#3a2a1e';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(${20 + r() * 60},${14 + r() * 30},${8 + r() * 20},0.6)`;
      ctx.fillRect(r() * 64, r() * 64, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

/** Pastilhas cerâmicas marrons da parede (≈ 2,1 cm cada, rejunte claro) */
export function mosaicTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const map = cached('mosaic', () => {
    const n = 32, px = 32, size = n * px;
    const [c, ctx] = canvas(size, size);
    const r = seeded(11);
    ctx.fillStyle = '#a39684';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const base = 0.75 + r() * 0.5;
        const R = Math.round(78 * base), G = Math.round(58 * base), B = Math.round(52 * base);
        ctx.fillStyle = `rgb(${R},${G},${B})`;
        ctx.fillRect(i * px + 3, j * px + 3, px - 6, px - 6);
        ctx.fillStyle = 'rgba(255,240,230,0.07)';
        ctx.fillRect(i * px + 5, j * px + 5, px - 14, 4);
      }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
  const bump = cached('mosaicBump', () => {
    const n = 32, px = 32, size = n * px;
    const [c, ctx] = canvas(size, size);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) ctx.fillRect(i * px + 3, j * px + 3, px - 6, px - 6);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
  return { map, bump };
}

/** Calçada de pedra portuguesa clara (pedras irregulares) */
export function stoneTexture(): THREE.CanvasTexture {
  return cached('stone', () => {
    const size = 1024;
    const [c, ctx] = canvas(size, size);
    const r = seeded(5);
    ctx.fillStyle = '#4c4b47';
    ctx.fillRect(0, 0, size, size);
    const step = 22;
    for (let y = 0; y < size; y += step)
      for (let x = 0; x < size; x += step) {
        const cx = x + r() * 6, cy = y + r() * 6;
        const v = 120 + Math.floor(r() * 70);
        ctx.fillStyle = `rgb(${v},${v},${v - 4})`;
        ctx.beginPath();
        const k = 5 + Math.floor(r() * 3);
        for (let i = 0; i < k; i++) {
          const a = (i / k) * Math.PI * 2 + r() * 0.5;
          const rad = step * (0.38 + r() * 0.2);
          const px = cx + step / 2 + Math.cos(a) * rad, py = cy + step / 2 + Math.sin(a) * rad;
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}

/** Gradiente radial para o espalhamento de luz dos LEDs */
export function glowTexture(): THREE.CanvasTexture {
  return cached('glow', () => {
    const [c, ctx] = canvas(128, 128);
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  });
}

/** Placa escura dos marcadores "57 - 71" e "89 - 103" */
export function placeholderTexture(label: string): THREE.CanvasTexture {
  return cached('ph' + label, () => {
    const [c, ctx] = canvas(512, 440);
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 512, 440);
    ctx.fillStyle = '#9a9a9a';
    ctx.font = `400 110px ${SERIF}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, 256, 200);
    ctx.font = `400 150px ${SANS}`;
    ctx.fillText('↓', 380, 360);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

export function textCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number, key: string) {
  return cached(key, () => {
    const [c, ctx] = canvas(w, h);
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  });
}
