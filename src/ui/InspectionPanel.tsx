import { BUTTON_GROUPS, MAPPING_SOURCE } from '../config/buttonGroups';
import { ARDUINO_NOTE, CONTROL_NOTES, CONTROL_PARTS, TECH_NOTES, TECH_PIECES, svgPiece, type BSource } from '../data/controlBoxes';
import { COMPONENTS } from '../data/electronics';
import { useStore } from '../state/store';
import { TECH_MARKERS } from '../scene/TechBox';

const TAG: Record<BSource, string> = { doc: 'documentado', est: 'estimado', conf: 'a confirmar' };
const mm = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const INTERIOR = new Set(['bottom', 'shelf1', 'shelf2']);
const Tag = ({ s }: { s: BSource }) => <span className={`tag ${s}`}>{TAG[s]}</span>;

/** Barra de ações da inspeção (sobre a cena) */
export function InspectControls() {
  const inspect = useStore((s) => s.inspect);
  const open = useStore((s) => s.inspectOpen);
  const exploded = useStore((s) => s.inspectExploded);
  const detached = useStore((s) => s.buttonsDetached);
  if (inspect === 'none') return null;
  const st = useStore.getState;
  const botoes = inspect === 'botoes';
  return (
    <div className="module-controls" role="toolbar" aria-label={botoes ? 'Inspeção da caixa de controle' : 'Inspeção da caixa técnica'}>
      <button aria-pressed={open} className={open ? 'on' : ''} onClick={() => useStore.setState({ inspectOpen: !open })}>
        {botoes ? (open ? 'Fechar tampa' : 'Abrir tampa') : open ? 'Painel opaco' : 'Painel transparente'}
      </button>
      <button aria-pressed={exploded} className={exploded ? 'on' : ''} onClick={() => { useStore.setState({ inspectExploded: !exploded }); st().say(exploded ? 'Remontando.' : 'Vista explodida das peças.'); }}>
        {exploded ? 'Remontar peças' : 'Explodir peças'}
      </button>
      {botoes && (
        <button aria-pressed={detached} className={detached ? 'on' : ''} onClick={() => useStore.setState({ buttonsDetached: !detached })}>
          {detached ? 'Recolocar botões' : 'Desmontar botões da face'}
        </button>
      )}
      {botoes && BUTTON_GROUPS.map((g, i) => (
        <button key={g.id} onClick={() => st().pressGroup(g.id)} aria-label={`Pressionar botão ${i + 1}, ${g.label}`}>
          <span className="dot" style={{ background: g.color }} />{i + 1}
        </button>
      ))}
      <button className="primary" onClick={() => st().closeInspect()}>Voltar à montagem original</button>
      <p className="hint">Clique nas peças para ver os detalhes. Esc encerra a inspeção.</p>
    </div>
  );
}

export function InspectionPanel() {
  const inspect = useStore((s) => s.inspect);
  const part = useStore((s) => s.inspectPart);
  const st = useStore.getState;
  if (inspect === 'botoes') {
    const p = CONTROL_PARTS.find((x) => x.id === part);
    return (
      <aside className="side-panel" aria-labelledby="insp-h">
        <h2 id="insp-h">Caixa de controle — 4 botões</h2>
        <p>Caixa de MDF claro entre a placa informativa e a tabela, logo abaixo da plaquinha de créditos. O tampo é uma superfície vazia; os botões ficam na face frontal.</p>
        <h3>Peças</h3>
        <ul className="parts">
          {CONTROL_PARTS.map((c) => (
            <li key={c.id}><button className={part === c.id ? 'on' : ''} aria-pressed={part === c.id} onClick={() => useStore.setState({ inspectPart: c.id })}>{c.name} <Tag s={c.source} /></button></li>
          ))}
        </ul>
        {p && <dl className="facts" aria-live="polite"><dt>Peça</dt><dd>{p.name}</dd><dt>Dimensões</dt><dd>{p.dims} <Tag s={p.source} /></dd><dt>Função</dt><dd>{p.role}</dd></dl>}
        <h3>Botões (da esquerda para a direita)</h3>
        <ul className="legend-list">
          {BUTTON_GROUPS.map((g, i) => <li key={g.id}><span className="dot" style={{ background: g.color }} />{i + 1}. {g.label}</li>)}
        </ul>
        <p className="hint">{MAPPING_SOURCE}</p>
        <h3>Origem das informações</h3>
        <ul>{CONTROL_NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
      </aside>
    );
  }
  if (inspect === 'tecnica') {
    const piece = TECH_PIECES.find((x) => x.id === part);
    const alias: Record<string, string> = { fios: 'dados', conectores: 'fitas' };
    const comp = COMPONENTS.find((c) => c.id === (part ? alias[part] ?? part : ''));
    return (
      <aside className="side-panel" aria-labelledby="insp-h">
        <h2 id="insp-h">Caixa técnica — eletrônica</h2>
        <p>Gabinete reconstruído a partir das peças de corte de <b>caixa_arduino.svg</b> (Manual Maker), com encaixes, rasgos e furos do arquivo. É um objeto separado da caixa de controle.</p>
        <div className="row">
          <button className="chip" onClick={() => { useStore.setState({ electronics: 'circuito' }); }}>Mostrar fiação até a tabela</button>
          <button className="chip" onClick={() => st().cameraCmd('techbox')}>Reenquadrar</button>
        </div>
        {piece && (
          <dl className="facts" aria-live="polite">
            <dt>Peça</dt><dd>{piece.name} <Tag s="doc" /></dd>
            <dt>Posição</dt><dd>{piece.role} <Tag s="est" /></dd>
            <dt>Recursos</dt><dd>{piece.feature}</dd>
            <dt>Medidas no SVG</dt><dd>{mm(svgPiece(piece.id).w)} × {mm(svgPiece(piece.id).h)} mm (com linguetas), espessura 3 mm (estimada)</dd>
          </dl>
        )}
        {comp && !piece && (
          <dl className="facts" aria-live="polite"><dt>Componente</dt><dd>{comp.name}</dd><dt>Especificação</dt><dd>{comp.spec}</dd><dt>Observação</dt><dd>{comp.note}</dd><dt>Posição</dt><dd>estimada (o SVG não indica)</dd></dl>
        )}
        <h3>Marcadores na cena</h3>
        <ul className="marker-list">
          {TECH_MARKERS.map((m) => (
            <li key={m.n}>
              <button type="button" className={`marker ${part === m.part ? 'on' : ''}`} aria-pressed={part === m.part} onClick={() => useStore.setState({ inspectPart: m.part })}>{m.n}</button>
              {m.text} <Tag s={m.tag} />{INTERIOR.has(m.group) && <small> (visível com o painel transparente ou explodido)</small>}
            </li>
          ))}
        </ul>
        <h3>Peças da prancha</h3>
        <ul className="parts">
          {TECH_PIECES.map((t) => (
            <li key={t.id}>
              <button className={part === t.id ? 'on' : ''} aria-pressed={part === t.id} onClick={() => useStore.setState({ inspectPart: t.id })} disabled={!t.role}>
                {t.name} {t.role ? <Tag s="est" /> : <small> — não usada na montagem</small>}
              </button>
            </li>
          ))}
        </ul>
        <h3>Componentes internos</h3>
        <ul className="parts">
          {[['fonte', 'Fonte 24 V / 2 A'], ['arduino', 'Arduino'], ['cooler', 'Cooler'], ['conversor', 'Conversão 24 V → 5 V'], ['conversor12', '12 V do cooler'], ['disjuntor', 'Disjuntor'], ['chave', 'Chave geral'], ['fios', 'Fios'], ['conectores', 'Conectores de 3 vias']].map(([id, l]) => (
            <li key={id}><button className={part === id ? 'on' : ''} onClick={() => useStore.setState({ inspectPart: id })}>{l}</button></li>
          ))}
        </ul>
        <p className="hint">{ARDUINO_NOTE}</p>
        <h3>Limites desta reconstrução</h3>
        <ul>{TECH_NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
        <p className="hint">A visualização mostra apenas a organização interna; não é um esquema de ligação. A parte de tensão de rede da fonte não é representada.</p>
      </aside>
    );
  }
  return null;
}
