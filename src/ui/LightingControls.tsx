import { BUTTON_GROUPS, MAPPING_SOURCE } from '../config/buttonGroups';
import { useStore, type ActiveGroup } from '../state/store';

/** Equivalentes acessíveis dos 4 botões de arcade + controles extras da simulação */
export function LightingControls() {
  const active = useStore((s) => s.activeGroup);
  const intensity = useStore((s) => s.intensity);
  const press = (g: ActiveGroup, label: string) => {
    const st = useStore.getState();
    st.pressGroup(g);
    st.say(g === 'todos' ? 'Todos os elementos acesos.' : g === 'nenhum' ? 'Todos os LEDs apagados.' : `Botão ${label}: grupo aceso, demais apagados.`);
  };
  return (
    <section className="panel-section" aria-labelledby="h-ilum">
      <h2 id="h-ilum">Iluminação — botões físicos</h2>
      <div className="arcade-row" role="group" aria-label="Botões de arcade da instalação">
        {BUTTON_GROUPS.map((g) => (
          <button
            key={g.id}
            className={`arcade ${active === g.id ? 'on' : ''}`}
            style={{ ['--c' as string]: g.color }}
            aria-pressed={active === g.id}
            onClick={() => press(g.id, g.label)}
          >
            <span className="cap" aria-hidden />
            <span>{g.label}</span>
          </button>
        ))}
      </div>
      <p className="hint">{MAPPING_SOURCE}</p>
      <div className="row">
        <button className={`chip ${active === 'todos' ? 'on' : ''}`} aria-pressed={active === 'todos'} onClick={() => press('todos', '')}>
          Todos acesos <small>(extra da simulação)</small>
        </button>
        <button className={`chip ${active === 'nenhum' ? 'on' : ''}`} aria-pressed={active === 'nenhum'} onClick={() => press('nenhum', '')}>
          Apagar tudo
        </button>
      </div>
      <label className="slider">
        <span>Intensidade dos LEDs: {Math.round(intensity * 100)}%</span>
        <input type="range" min={0} max={1.5} step={0.05} value={intensity} onChange={(e) => useStore.setState({ intensity: Number(e.target.value) })} />
      </label>
    </section>
  );
}
