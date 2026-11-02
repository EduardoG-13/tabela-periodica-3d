/**
 * Placa informativa (foto 5), plaquinha de créditos e placa de QR Codes
 * complementar. Textos e QR Codes desenhados em canvas; pontos braile em relevo
 * como geometria instanciada.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import QRCode from 'qrcode';
import { BOARD, CREDITS } from '../lib/layout';
import { brailleDotPositions, toBrailleCells } from '../lib/braille';
import { SANS, ensureFonts, textCanvasTexture } from '../lib/textures';
import { getQrLinks, type LinkId, type QrLink } from '../config/links';
import { BUTTON_GROUPS } from '../config/buttonGroups';

import { BOARD_TEXT } from '../data/boardText';
export { BOARD_TEXT };

const PX = 2048;
const S = PX / BOARD.w; // px por metro

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function drawQr(ctx: CanvasRenderingContext2D, link: QrLink | undefined, x: number, y: number, size: number) {
  // moldura pontilhada como na placa original
  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#333';
  ctx.strokeRect(x - 10, y - 10, size + 20, size + 20);
  ctx.restore();
  if (!link?.url) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);
    ctx.fillStyle = '#777';
    ctx.font = `400 18px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('QR não configurado', x + size / 2, y + size / 2);
    return;
  }
  const qr = QRCode.create(link.url, { errorCorrectionLevel: 'M' });
  const n = qr.modules.size;
  const quiet = 2;
  const cell = size / (n + quiet * 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (qr.modules.get(r, c)) ctx.fillRect(x + (c + quiet) * cell, y + (r + quiet) * cell, Math.ceil(cell), Math.ceil(cell));
}

/** Layout (m, a partir do canto superior esquerdo da placa) */
const L = {
  titleY: 0.07,
  p1Y: 0.135,
  qrHist: { x: 0.2, y: 0.315, s: 0.11 },
  p2Y: 0.47,
  labels: { y: 0.6, h: 0.1 },
  qrGroup: { y: 0.715, s: 0.085 },
};

interface BrailleLine { text: string; x: number; y: number; maxW: number; center?: boolean }

export function InfoBoard() {
  const [ready, setReady] = useState(false);
  useEffect(() => void ensureFonts().then(() => setReady(true)), []);
  return ready ? <InfoBoardInner /> : null;
}

function InfoBoardInner() {
  const links = useMemo(() => getQrLinks(), []);
  const byId = (id: LinkId) => links.find((l) => l.id === id);
  const lineH = 0.03;

  const { texture, brailleLines, p1Lines, p2Lines } = useMemo(() => {
    const H = Math.round(BOARD.h * S);
    let p1L = 0, p2L = 0;
    const tex = textCanvasTexture((ctx) => {
      ctx.fillStyle = '#f4f5f4';
      ctx.fillRect(0, 0, PX, H);
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.font = `700 ${0.034 * S}px ${SANS}`;
      ctx.fillText(BOARD_TEXT.title, PX / 2, L.titleY * S);
      ctx.textAlign = 'left';
      ctx.font = `400 ${0.024 * S}px ${SANS}`;
      const l1 = wrap(ctx, BOARD_TEXT.p1, (BOARD.w - 0.08) * S);
      p1L = l1.length;
      l1.forEach((t, i) => ctx.fillText(i === 0 ? '      ' + t : t, 0.04 * S, (L.p1Y + i * lineH) * S));
      const l2 = wrap(ctx, BOARD_TEXT.p2, (BOARD.w - 0.08) * S);
      p2L = l2.length;
      l2.forEach((t, i) => ctx.fillText(i === 0 ? '    ' + t : t, 0.04 * S, (L.p2Y + i * lineH) * S));
      const q = L.qrHist;
      drawQr(ctx, byId('historia'), q.x * S, q.y * S, q.s * S);
      ctx.font = `400 ${0.024 * S}px ${SANS}`;
      ctx.fillText('História da Tabela Periódica', (q.x + q.s + 0.05) * S, (q.y + q.s / 2 + 0.008) * S);
      const ids: LinkId[] = ['hidrogenio', 'metais', 'ametais', 'gases'];
      ids.forEach((id, i) => {
        const cx = (0.02 + 0.2 * i + 0.1) * BOARD.w / 0.84;
        drawQr(ctx, byId(id), (cx - L.qrGroup.s / 2) * S, L.qrGroup.y * S, L.qrGroup.s * S);
      });
    }, PX, H, 'board');
    const lines: BrailleLine[] = [
      { text: BOARD_TEXT.title, x: BOARD.w / 2, y: L.titleY + 0.022, maxW: 0.5, center: true },
      { text: BOARD_TEXT.p1, x: 0.04, y: L.p1Y + p1L * lineH - 0.008, maxW: BOARD.w - 0.08 },
      { text: 'QR code', x: L.qrHist.x - 0.1, y: L.qrHist.y + L.qrHist.s - 0.005, maxW: 0.2 },
      { text: BOARD_TEXT.p2, x: 0.04, y: L.p2Y + p2L * lineH - 0.008, maxW: BOARD.w - 0.08 },
      ...[0, 1, 2, 3].map((i) => ({ text: 'QR code', x: (0.02 + 0.2 * i + 0.1) * BOARD.w / 0.84, y: L.qrGroup.y + L.qrGroup.s + 0.022, maxW: 0.2, center: true })),
    ];
    return { texture: tex, brailleLines: lines, p1Lines: p1L, p2Lines: p2L };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links]);
  void p1Lines;
  void p2Lines;

  // pontos braile da placa (inclui os rótulos coloridos)
  const dots = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const MMm = 0.001;
    const place = (text: string, x0: number, y0: number, maxW: number, center = false) => {
      // quebra em linhas de celas que caibam em maxW
      const words = text.split(' ');
      const lines: string[] = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (toBrailleCells(t).length * 6 * MMm > maxW && cur) {
          lines.push(cur);
          cur = w;
        } else cur = t;
      }
      if (cur) lines.push(cur);
      lines.forEach((ln, li) => {
        const w = toBrailleCells(ln).length * 6 * MMm;
        const sx = center ? x0 - w / 2 : x0;
        for (const d of brailleDotPositions(ln)) {
          out.push(new THREE.Matrix4().makeTranslation(-BOARD.w / 2 + sx + d.x * MMm, BOARD.h / 2 - (y0 + li * 0.01 + d.y * MMm), 0.0062));
        }
      });
    };
    for (const l of brailleLines) place(l.text, l.x, l.y, l.maxW, l.center);
    BUTTON_GROUPS.forEach((g, i) => place(g.braille, (0.02 + 0.2 * i + 0.1) * BOARD.w / 0.84, L.labels.y + 0.068, 0.18, true));
    return out;
  }, [brailleLines]);

  const dotRef = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    dots.forEach((m, i) => dotRef.current.setMatrixAt(i, m));
    dotRef.current.instanceMatrix.needsUpdate = true;
    dotRef.current.computeBoundingSphere();
  }, [dots]);
  const dotGeo = useMemo(() => new THREE.SphereGeometry(0.0007, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), []);

  const labelTex = useMemo(
    () => BUTTON_GROUPS.map((g) => textCanvasTexture((ctx, w, h) => {
      ctx.fillStyle = g.color;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${h * 0.3}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 4;
      ctx.fillText(g.label, w / 2, h * 0.48);
    }, 512, 256, 'lbl' + g.id)),
    [],
  );

  const open = (url: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (url) window.open(url, '_blank', 'noopener');
  };
  const qrHit = (id: LinkId, cx: number, cy: number, s: number) => {
    const url = byId(id)?.url ?? '';
    return (
      <mesh key={id} position={[-BOARD.w / 2 + cx, BOARD.h / 2 - cy, 0.0065]} onClick={open(url)}
        onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        <planeGeometry args={[s, s]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    );
  };

  return (
    <group>
      <group position={[BOARD.x, BOARD.y, 0]}>
        {/* placa branca de acrílico 6 mm afastada por espaçadores */}
        <mesh position={[0, 0, 0.003]} castShadow receiveShadow>
          <boxGeometry args={[BOARD.w, BOARD.h, 0.006]} />
          <meshPhysicalMaterial attach="material-0" color="#e8eae8" roughness={0.3} />
          <meshPhysicalMaterial attach="material-1" color="#e8eae8" roughness={0.3} />
          <meshPhysicalMaterial attach="material-2" color="#e8eae8" roughness={0.3} />
          <meshPhysicalMaterial attach="material-3" color="#e8eae8" roughness={0.3} />
          <meshPhysicalMaterial attach="material-4" map={texture} roughness={0.25} clearcoat={0.6} />
          <meshPhysicalMaterial attach="material-5" color="#e8eae8" />
        </mesh>
        {/* espaçadores cromados nos cantos */}
        {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
          <mesh key={i} position={[sx * (BOARD.w / 2 - 0.035), sy * (BOARD.h / 2 - 0.035), 0.009]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.008, 24]} />
            <meshStandardMaterial color="#e6e6e6" metalness={0.6} roughness={0.22} />
          </mesh>
        ))}
        {BUTTON_GROUPS.map((g, i) => (
          <mesh key={g.id} position={[-BOARD.w / 2 + (0.02 + 0.2 * i + 0.1) * BOARD.w / 0.84, BOARD.h / 2 - L.labels.y - L.labels.h / 2 + 0.01, 0.0075]}>
            <boxGeometry args={[0.19, L.labels.h, 0.003]} />
            <meshPhysicalMaterial attach="material-0" color={g.color} />
            <meshPhysicalMaterial attach="material-1" color={g.color} />
            <meshPhysicalMaterial attach="material-2" color={g.color} />
            <meshPhysicalMaterial attach="material-3" color={g.color} />
            <meshPhysicalMaterial attach="material-4" map={labelTex[i]} roughness={0.2} clearcoat={1} />
            <meshPhysicalMaterial attach="material-5" color={g.color} />
          </mesh>
        ))}
        <instancedMesh ref={dotRef} args={[dotGeo, undefined, dots.length]} position={[0, 0, 0.0005]}>
          <meshPhysicalMaterial color="#ffffff" roughness={0.15} clearcoat={1} transparent opacity={0.9} />
        </instancedMesh>
        {qrHit('historia', L.qrHist.x + L.qrHist.s / 2, L.qrHist.y + L.qrHist.s / 2, L.qrHist.s)}
        {(['hidrogenio', 'metais', 'ametais', 'gases'] as LinkId[]).map((id, i) =>
          qrHit(id, (0.02 + 0.2 * i + 0.1) * BOARD.w / 0.84, L.qrGroup.y + L.qrGroup.s / 2, L.qrGroup.s))}
      </group>
      <CreditsPlate />
      <ExtraQrPlate links={links} />
    </group>
  );
}

/** Plaquinha "Galera que fez" — transcrição da fotografia (imagem 5) */
function CreditsPlate() {
  const tex = useMemo(() => textCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#f2f2f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    const blocks: [string, string[]][] = [
      ['Galera que fez ☺', ['Eduardo Gabriel de Oliveira', 'Laura C. Resende', 'Ana Paula N. Sampaio']],
      ['Equipe de Química', ['Dayse P. B. Souza', 'Gisele Cantalice S. da Silva', 'Marcos André F. A. Santos', 'Carla Rênes A. M. Fontenelle']],
      ['Colaboradores', ['Eduarda C. V. Loureiro', 'Elisa G. Batista', 'Italy Aléxia L. Aquino', 'Letícia Ariel S. Freitas', 'Antony Thiago S. Freitas', 'João Victor C. Matos']],
      ['Agradecimento', ['Geovana M. Coccaro 15-17', 'Turma 22-24', 'Rio 2024']],
    ];
    let y = 46;
    for (const [t, names] of blocks) {
      ctx.font = `700 26px ${SANS}`;
      ctx.fillText(t, w / 2, y);
      y += 30;
      ctx.font = `400 19px ${SANS}`;
      for (const n of names) {
        ctx.fillText(n, w / 2, y);
        y += 23;
      }
      y += 18;
    }
  }, 300, 600, 'credits'), []);
  return (
    <mesh position={[CREDITS.x, CREDITS.y, 0.004]} castShadow>
      <boxGeometry args={[CREDITS.w, CREDITS.h, 0.004]} />
      <meshStandardMaterial attach="material-0" color="#eee" />
      <meshStandardMaterial attach="material-1" color="#eee" />
      <meshStandardMaterial attach="material-2" color="#eee" />
      <meshStandardMaterial attach="material-3" color="#eee" />
      <meshStandardMaterial attach="material-4" map={tex} roughness={0.35} />
      <meshStandardMaterial attach="material-5" color="#eee" />
    </mesh>
  );
}

/** Acréscimo do gêmeo digital (não existe na instalação física): QR do projeto e do guia de acessibilidade */
function ExtraQrPlate({ links }: { links: QrLink[] }) {
  const proj = links.find((l) => l.id === 'projeto');
  const acc = links.find((l) => l.id === 'acessibilidade');
  const W = 0.2, H = 0.125;
  const tex = useMemo(() => textCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#f2f2f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111';
    ctx.textAlign = 'center';
    ctx.font = `700 26px ${SANS}`;
    ctx.fillText('Gêmeo digital', w / 2, 34);
    drawQr(ctx, proj, 40, 62, 170);
    drawQr(ctx, acc, w - 210, 62, 170);
    ctx.font = `400 20px ${SANS}`;
    ctx.fillStyle = '#111';
    ctx.fillText('Explicação do projeto', 125, 270);
    ctx.fillText('Guia de acessibilidade', w - 125, 270);
    ctx.font = `400 14px ${SANS}`;
    ctx.fillStyle = '#666';
    ctx.fillText('(placa acrescentada na simulação)', w / 2, 296);
  }, 500, 312, 'extraqr'), [proj, acc]);
  // fora da área fotografada: à esquerda da placa informativa
  const x = BOARD.x - BOARD.w / 2 - 0.16, y = BOARD.y - BOARD.h / 2 + H / 2;
  const hit = (url: string | undefined, dx: number) => (
    <mesh position={[x + dx, y + 0.0, 0.0065]} onClick={(e) => { e.stopPropagation(); if (url) window.open(url, '_blank', 'noopener'); }}>
      <planeGeometry args={[0.07, 0.07]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
  return (
    <group>
      <mesh position={[x, y, 0.003]} castShadow>
        <boxGeometry args={[W, H, 0.004]} />
        <meshStandardMaterial attach="material-0" color="#eee" />
        <meshStandardMaterial attach="material-1" color="#eee" />
        <meshStandardMaterial attach="material-2" color="#eee" />
        <meshStandardMaterial attach="material-3" color="#eee" />
        <meshStandardMaterial attach="material-4" map={tex} roughness={0.35} />
        <meshStandardMaterial attach="material-5" color="#eee" />
      </mesh>
      {hit(proj?.url, -0.05)}
      {hit(acc?.url, 0.05)}
    </group>
  );
}
