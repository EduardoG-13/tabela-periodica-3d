import { useRef } from 'react';
import { ELEMENTS, PLACEHOLDERS } from '../data/elements';
import { CATEGORIES } from '../data/categories';
import { GROUP_BY_ID, buttonGroupOf } from '../config/buttonGroups';
import { massLabel } from '../lib/format';
import { neighbor } from '../lib/layout';
import { isLit, useStore } from '../state/store';

/**
 * Visualização plana: mesma disposição da instalação (séries f nas colunas 4–18).
 * Funciona também como alternativa acessível completa à cena 3D: grade com
 * navegação por setas (tabindex móvel) e rótulos completos para leitores de tela.
 */
export function FlatTable() {
  const s = useStore();
  const refs = useRef<Record<number, HTMLButtonElement | null>>({});
  const current = s.focused ?? 1;
  const onKey = (ev: React.KeyboardEvent, z: number) => {
    const dir = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const)[ev.key as 'ArrowLeft'];
    if (!dir) return;
    ev.preventDefault();
    const n = neighbor(z, dir);
    useStore.setState({ focused: n });
    refs.current[n]?.focus();
  };
  const rowTop = (r: number) => (r <= 7 ? r : r + 1); // linha vazia entre o período 7 e as séries f
  return (
    <div className="flat-wrap">
      <div className="flat" role="grid" aria-label="Tabela periódica — visualização plana. Use as setas para navegar e Enter para abrir o elemento." aria-rowcount={9} aria-colcount={18}>
        {ELEMENTS.map((e) => {
          const lit = isLit(s, e.number);
          const g = GROUP_BY_ID[buttonGroupOf(e.number)];
          const dim = s.categoryFilter && e.category !== s.categoryFilter;
          return (
            <button
              key={e.number}
              ref={(b) => void (refs.current[e.number] = b)}
              role="gridcell"
              tabIndex={e.number === current ? 0 : -1}
              className={`cell ${lit ? 'lit' : ''} ${dim ? 'dim' : ''} ${s.selected === e.number ? 'sel' : ''}`}
              style={{ gridColumn: e.col, gridRow: rowTop(e.row), ['--led' as string]: g.color, ['--cat' as string]: CATEGORIES[e.category].color }}
              aria-label={`${e.name}, ${e.symbol}, número atômico ${e.number}, massa ${massLabel(e)}, ${CATEGORIES[e.category].label}, período ${e.period}${e.group ? `, grupo ${e.group}` : ''}. LED ${lit ? 'aceso' : 'apagado'}.`}
              onFocus={() => useStore.setState({ focused: e.number })}
              onKeyDown={(ev) => onKey(ev, e.number)}
              onClick={() => s.select(e.number)}
            >
              <span className="n">{e.number}</span>
              <span className="sym">{e.symbol}</span>
              <span className="nm">{e.name}</span>
              <span className="ms">{massLabel(e)}</span>
            </button>
          );
        })}
        {PLACEHOLDERS.map((p) => (
          <div key={p.id} className="cell ph" style={{ gridColumn: p.col, gridRow: p.row }} aria-hidden>
            {p.label} ↓
          </div>
        ))}
      </div>
      <ul className="legend" aria-label="Legenda das categorias">
        {Object.entries(CATEGORIES).map(([id, c]) => (
          <li key={id}><span className="dot" style={{ background: c.color }} />{c.label}</li>
        ))}
      </ul>
    </div>
  );
}
