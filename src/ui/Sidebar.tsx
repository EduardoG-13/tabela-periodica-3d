import { useMemo, useState } from 'react';
import { ELEMENTS, type CategoryId } from '../data/elements';
import { CATEGORIES } from '../data/categories';
import { useStore } from '../state/store';
import { LightingControls } from './LightingControls';

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function Sidebar() {
  const open = useStore((s) => s.sidebarOpen);
  const filter = useStore((s) => s.categoryFilter);
  const showLabels = useStore((s) => s.showLabels);
  const showWiring = useStore((s) => s.showWiring);
  const quality = useStore((s) => s.quality);
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return [];
    return ELEMENTS.filter((e) => normalize(e.name).includes(n) || e.symbol.toLowerCase() === n || String(e.number) === n || normalize(e.symbol).startsWith(n)).slice(0, 8);
  }, [q]);
  const choose = (z: number) => {
    useStore.getState().select(z);
    setQ('');
  };

  return (
    <aside id="sidebar" className={`sidebar ${open ? 'open' : ''}`} aria-label="Ferramentas">
      <section className="panel-section" role="search">
        <h2><label htmlFor="busca">Pesquisar elemento</label></h2>
        <input
          id="busca" type="search" value={q} placeholder="Nome, símbolo ou número" autoComplete="off"
          aria-describedby="busca-dica" aria-controls="busca-res"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) choose(results[0].number); }}
        />
        <p id="busca-dica" className="hint">Enter retira o primeiro resultado do nicho.</p>
        {results.length > 0 && (
          <ul id="busca-res" className="results">
            {results.map((e) => (
              <li key={e.number}>
                <button onClick={() => choose(e.number)}>
                  <b>{e.symbol}</b> {e.name} <small>Z={e.number}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel-section">
        <h2><label htmlFor="filtro">Filtrar por categoria química</label></h2>
        <select id="filtro" value={filter ?? ''} onChange={(e) => useStore.setState({ categoryFilter: (e.target.value || null) as CategoryId | null })}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIES).map(([id, c]) => (
            <option key={id} value={id}>{c.label} ({ELEMENTS.filter((e) => e.category === id).length})</option>
          ))}
        </select>
        <p className="hint">Os módulos fora da categoria ficam com brilho reduzido.</p>
      </section>

      <LightingControls />

      <section className="panel-section">
        <h2>Exibição</h2>
        <label className="toggle"><input type="checkbox" checked={showLabels} onChange={(e) => useStore.setState({ showLabels: e.target.checked })} /> Mostrar etiquetas (grupos, períodos e peças)</label>
        <label className="toggle"><input type="checkbox" checked={showWiring} onChange={(e) => useStore.setState({ showWiring: e.target.checked })} /> Mostrar conexões elétricas</label>
        <label className="toggle"><input type="checkbox" checked={quality === 'economica'} onChange={(e) => useStore.setState({ quality: e.target.checked ? 'economica' : 'alta' })} /> Modo econômico (sem sombras, para computadores modestos)</label>
      </section>
    </aside>
  );
}
