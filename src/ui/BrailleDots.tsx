import { toBrailleCells, toBrailleUnicode } from '../lib/braille';

/**
 * Braile desenhado como pontos (SVG), sem depender de uma fonte com os caracteres U+2800.
 * Leitores de tela recebem a transcrição Unicode e o texto original.
 */
export function BrailleDots({ text, size = 18, label }: { text: string; size?: number; label?: string }) {
  const cells = toBrailleCells(text);
  const cw = 6, h = 9; // cela 6 × 9 unidades (pontos a cada 2,5; raio 0,8)
  const pos: Record<number, [number, number]> = { 1: [1.5, 1.5], 2: [1.5, 4.5], 3: [1.5, 7.5], 4: [4.5, 1.5], 5: [4.5, 4.5], 6: [4.5, 7.5] };
  return (
    <span className="braille-dots" role="img" aria-label={label ?? `Braile: ${text} (${toBrailleUnicode(text)})`}>
      <svg viewBox={`0 0 ${cells.length * cw} ${h}`} height={size} width={(size * cells.length * cw) / h} aria-hidden="true" focusable="false">
        {cells.map((c, i) => (
          <g key={i} transform={`translate(${i * cw} 0)`}>
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <circle key={d} cx={pos[d][0]} cy={pos[d][1]} r={c.includes(d) ? 1.05 : 0.45} fill="currentColor" opacity={c.includes(d) ? 1 : 0.18} />
            ))}
          </g>
        ))}
      </svg>
    </span>
  );
}
