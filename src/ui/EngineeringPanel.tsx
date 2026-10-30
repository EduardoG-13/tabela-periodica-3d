import { PARTS } from '../data/construction';
import { COMPONENTS, POWER_NOTE, WIRE_LEGEND, type ESource } from '../data/electronics';
import { getElement } from '../data/elements';
import { useStore, type ElectronicsView } from '../state/store';

const TAG: Record<ESource, string> = { doc: 'documentado', est: 'estimado', ilu: 'ilustrativo', conf: 'a confirmar' };
export const Tag = ({ s }: { s: ESource }) => <span className={`tag ${s}`}>{TAG[s]}</span>;

const VIEWS: [ElectronicsView, string][] = [
  ['normal', 'Instalação normal'], ['circuito', 'Circuito visível'], ['alimentacao', 'Fluxo de alimentação'],
  ['dados', 'Fluxo de dados'], ['identificados', 'Módulos identificados'], ['explodido', 'Visão explodida do sistema'],
];

export function EngineeringPanel() {
  const selected = useStore((s) => s.selected);
  const phase = useStore((s) => s.phase);
  const part = useStore((s) => s.selectedPart);
  const exploded = useStore((s) => s.exploded);
  const view = useStore((s) => s.electronics);
  const st = useStore.getState;
  const spec = PARTS.find((p) => p.id === part);
  const el = selected && phase !== 'none' ? getElement(selected) : null;

  return (
    <aside className="side-panel" aria-labelledby="eng-h">
      <h2 id="eng-h">Engenharia</h2>

      <h3>Montagem do módulo</h3>
      {el ? (
        <>
          <p>Módulo <b>{el.number} — {el.symbol} ({el.name})</b> fora do nicho.</p>
          <div className="row">
            <button className={`chip ${exploded ? 'on' : ''}`} aria-pressed={exploded} onClick={() => useStore.setState({ exploded: !exploded })}>
              {exploded ? 'Remontar caixa' : 'Explodir peças'}
            </button>
            <button className="chip" onClick={() => st().returnToNiche()}>Voltar ao nicho</button>
          </div>
        </>
      ) : (
        <p className="hint">Retire um elemento do nicho (clique nele ou use a pesquisa) para inspecionar as peças.</p>
      )}
      <ul className="parts" aria-label="Peças do módulo, em ordem de montagem">
        {PARTS.map((p) => (
          <li key={p.id}>
            <button className={part === p.id ? 'on' : ''} aria-pressed={part === p.id} onClick={() => { useStore.setState({ selectedPart: p.id }); st().say(`${p.name}. ${p.role}`); }}>
              {p.order}. {p.name} <Tag s={p.source} />
            </button>
          </li>
        ))}
      </ul>
      {spec && (
        <dl className="facts" aria-live="polite">
          <dt>Peça</dt><dd>{spec.name}</dd>
          <dt>Material</dt><dd>{spec.material}</dd>
          <dt>Função</dt><dd>{spec.role}</dd>
          <dt>Dimensões</dt><dd>{spec.dims} <Tag s={spec.source} /></dd>
          <dt>Fixação</dt><dd>{spec.fixing}</dd>
          <dt>Interação</dt><dd>{spec.interacts}</dd>
        </dl>
      )}

      <h3>Explorar eletrônica</h3>
      <div className="row" role="group" aria-label="Modos visuais da eletrônica">
        {VIEWS.map(([v, l]) => (
          <button key={v} className={`chip ${view === v ? 'on' : ''}`} aria-pressed={view === v} onClick={() => {
            useStore.setState({ electronics: v });
            if (v === 'explodido') st().cameraCmd('home');
            else if (v !== 'normal') st().cameraCmd('electronics');
          }}>{l}</button>
        ))}
      </div>
      <div className="row">
        <button className="chip" onClick={() => st().cameraCmd('back')}>Ver parte traseira</button>
        <button className="chip" onClick={() => st().cameraCmd('electronics')}>Ver caixa dos eletrônicos</button>
      </div>
      <h3>Legenda dos fios</h3>
      <ul className="legend-list">
        {WIRE_LEGEND.map((w) => (
          <li key={w.label}><span className="swatch" style={{ background: w.color }} />{w.label} <Tag s={w.source} /></li>
        ))}
      </ul>
      <h3>Componentes</h3>
      <ul className="legend-list" style={{ display: 'block' }}>
        {COMPONENTS.map((c) => (
          <li key={c.id} style={{ display: 'block', marginBottom: 8 }}>
            <b>{c.name}</b> <Tag s={c.source} />
            <br /><small>{c.spec}. {c.note}</small>
          </li>
        ))}
      </ul>
      <h3>Verificação de potência (estimativa)</h3>
      <p>
        {POWER_NOTE.leds} LEDs × até {POWER_NOTE.maxPerLedA * 1000} mA (branco pleno, valor típico de LEDs endereçáveis) ≈ {POWER_NOTE.maxA.toFixed(1).replace('.', ',')} A em 5 V.
        A fonte de {POWER_NOTE.supplyW} W forneceria no máximo ≈ {POWER_NOTE.supply5vA.toFixed(1).replace('.', ',')} A em 5 V com conversão ideal.
        Como só um grupo fica aceso por vez e cada cor usa um ou dois canais, o consumo real é menor — mas o dimensionamento deve ser confirmado na instalação.
      </p>
    </aside>
  );
}
