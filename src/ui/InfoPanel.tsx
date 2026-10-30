import { ELEMENTS, getElement, type ChemicalElement } from '../data/elements';
import { CATEGORIES, STATES } from '../data/categories';
import { GROUP_BY_ID, buttonGroupOf } from '../config/buttonGroups';
import { configPretty, kToC, massLong, num } from '../lib/format';
import { toBrailleUnicode } from '../lib/braille';
import { isLit, useStore } from '../state/store';

function classification(e: ChemicalElement) {
  return e.predictedCategory ? `${CATEGORIES[e.category].label} — ${e.predictedCategory}` : CATEGORIES[e.category].label.toLowerCase();
}
function position(e: ChemicalElement) {
  const serie = e.row === 8 ? ', série dos lantanídeos' : e.row === 9 ? ', série dos actinídeos' : '';
  return `Período ${e.period}${e.group ? `, grupo ${e.group}` : ''}, bloco ${e.block}${serie}`;
}

function Props({ e }: { e: ChemicalElement }) {
  const p = e.physical;
  const pred = e.number >= 100 ? ' (previsto)' : '';
  return (
    <dl className="props">
      {p.density != null && <><dt>Densidade</dt><dd>{num(p.density)} {p.densityUnit.replace('cm3', 'cm³')}{pred}</dd></>}
      {p.meltK != null && <><dt>Fusão</dt><dd>{kToC(p.meltK)} °C{pred}</dd></>}
      {p.boilK != null && <><dt>Ebulição</dt><dd>{kToC(p.boilK)} °C{pred}</dd></>}
      {p.electronegativity != null && <><dt>Eletronegatividade</dt><dd>{num(p.electronegativity, 2)} (Pauling)</dd></>}
    </dl>
  );
}

export function speakElement(e: ChemicalElement) {
  useStore.getState().say(
    `${e.name}, símbolo ${e.symbol.split('').join(' ')}, número atômico ${e.number}. Massa ${massLong(e).replace('u', 'unidades')}. ${classification(e)}, ${STATES[e.state]}. ${e.description}`,
  );
}

export function InfoPanel() {
  const selected = useStore((s) => s.selected);
  const phase = useStore((s) => s.phase);
  const compareWith = useStore((s) => s.compareWith);
  const lit = useStore((s) => (s.selected ? isLit(s, s.selected) : false));
  if (!selected || phase === 'returning') return null;
  const e = getElement(selected);
  const g = GROUP_BY_ID[buttonGroupOf(e.number)];
  const other = compareWith ? getElement(compareWith) : null;

  return (
    <aside className="info-panel" aria-labelledby="el-title" aria-live="polite">
      <header>
        <p className="el-num" aria-hidden>{e.number} — {e.symbol}</p>
        <h2 id="el-title">{e.name} <span className="sr-only">, símbolo {e.symbol}, número atômico {e.number}</span></h2>
        <button className="close" onClick={() => useStore.getState().returnToNiche()} aria-label="Fechar e voltar o módulo ao nicho">×</button>
      </header>
      <dl className="facts">
        <dt>Massa atômica</dt><dd>{massLong(e)}</dd>
        <dt>Configuração eletrônica</dt><dd>{configPretty(e.config)}{e.configPredicted && <small> (prevista)</small>}</dd>
        <dt>Classificação</dt><dd>{classification(e)}</dd>
        <dt>Estado físico</dt><dd>{STATES[e.state]}</dd>
        <dt>Posição na tabela</dt><dd>{position(e)}</dd>
        <dt>Botão / LED</dt><dd><span className="dot" style={{ background: g.color }} /> {g.label} — {lit ? 'aceso' : 'apagado'}</dd>
        <dt>Braile da plaquinha</dt><dd className="braille" aria-label={`Transcrição braile de ${e.name}`}>{toBrailleUnicode(e.name)}</dd>
      </dl>
      <section><h3>Descrição</h3><p>{e.description}</p></section>
      <section><h3>História e descoberta</h3><p>{e.discoveryYear} — {e.discoverer}.</p></section>
      <section><h3>Propriedades importantes</h3><Props e={e} /></section>
      <section><h3>Aplicações cotidianas</h3><p>{e.uses}</p></section>
      <section><h3>Curiosidade</h3><p>{e.curiosity}</p></section>
      {e.safety && <section className="safety"><h3>Segurança</h3><p>{e.safety}</p></section>}
      <div className="row">
        <button className="chip" onClick={() => speakElement(e)}>Ouvir descrição</button>
      </div>
      <section className="compare">
        <h3><label htmlFor="cmp">Comparar com outro elemento</label></h3>
        <select id="cmp" value={compareWith ?? ''} onChange={(ev) => useStore.setState({ compareWith: ev.target.value ? Number(ev.target.value) : null })}>
          <option value="">— escolher —</option>
          {ELEMENTS.filter((x) => x.number !== e.number).map((x) => (
            <option key={x.number} value={x.number}>{x.number} {x.symbol} — {x.name}</option>
          ))}
        </select>
        {other && (
          <table>
            <caption className="sr-only">Comparação entre {e.name} e {other.name}</caption>
            <thead><tr><th scope="col">Propriedade</th><th scope="col">{e.symbol}</th><th scope="col">{other.symbol}</th></tr></thead>
            <tbody>
              <tr><th scope="row">Número atômico</th><td>{e.number}</td><td>{other.number}</td></tr>
              <tr><th scope="row">Massa</th><td>{massLong(e).split(' —')[0]}</td><td>{massLong(other).split(' —')[0]}</td></tr>
              <tr><th scope="row">Configuração</th><td>{configPretty(e.config)}</td><td>{configPretty(other.config)}</td></tr>
              <tr><th scope="row">Classificação</th><td>{CATEGORIES[e.category].label}</td><td>{CATEGORIES[other.category].label}</td></tr>
              <tr><th scope="row">Estado</th><td>{STATES[e.state].split(' (')[0]}</td><td>{STATES[other.state].split(' (')[0]}</td></tr>
              <tr><th scope="row">Período / grupo</th><td>{e.period} / {e.group ?? 'f'}</td><td>{other.period} / {other.group ?? 'f'}</td></tr>
              <tr><th scope="row">Eletronegatividade</th><td>{e.physical.electronegativity ?? '—'}</td><td>{other.physical.electronegativity ?? '—'}</td></tr>
              <tr><th scope="row">Descoberta</th><td>{e.discoveryYear}</td><td>{other.discoveryYear}</td></tr>
            </tbody>
          </table>
        )}
      </section>
      <p className="hint">Propriedades físicas: conjunto de dados aberto Periodic-Table-JSON. Massas: valores abreviados IUPAC/CIAAW.</p>
    </aside>
  );
}
