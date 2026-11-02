import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { accessibilityQrIsLocal, getQrLinks, PROJECT_LINKS } from '../config/links';
import { ELEMENTS } from '../data/elements';
import { BUTTON_GROUPS, buttonGroupOf } from '../config/buttonGroups';
import { BOARD_TEXT } from '../data/boardText';
import { toBrailleUnicode } from '../lib/braille';
import { useStore } from '../state/store';

function QrCard({ label, url, note }: { label: string; url: string; note: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    if (url) QRCode.toString(url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }).then(setSvg);
  }, [url]);
  return (
    <figure className="qr-card" style={{ margin: 0 }}>
      {url ? <span role="img" aria-label={`QR Code: ${label}`} dangerouslySetInnerHTML={{ __html: svg }} /> : <p>QR não configurado</p>}
      <figcaption><b>{label}</b><br />{url && <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>}<br /><small>{note}</small></figcaption>
    </figure>
  );
}

/** Descrição textual completa da cena (alternativa ao 3D para leitores de tela) */
export function SceneDescription() {
  const counts = BUTTON_GROUPS.map((g) => `${g.label}: ${ELEMENTS.filter((e) => buttonGroupOf(e.number) === g.id).length}`).join('; ');
  return (
    <div id="scene-desc" className="sr-only">
      Instalação em uma parede de pastilhas marrons, com piso de pedra clara. No alto, a inscrição metálica “Tabela Periódica”.
      A tabela tem 118 caixas de MDF branco em nichos, organizadas em 18 grupos e 7 períodos, com lantanídeos e actinídeos em duas linhas
      separadas abaixo, das colunas 4 a 18. Cada caixa tem uma placa de acrílico transparente gravada com número atômico, configuração
      eletrônica, símbolo, nome e massa, iluminada por cinco LEDs, e uma plaquinha frontal com o nome em alto-relevo e em braile.
      À esquerda fica a placa informativa com QR Codes. Entre a placa e a primeira coluna da tabela há uma plaquinha de créditos
      e, logo abaixo dela, na altura do potássio, a caixa de controle: uma caixa de MDF claro com o tampo vazio e quatro botões
      de arcade na face frontal — vermelho, verde, amarelo e azul, da esquerda para a direita — que acendem os grupos ({counts}).
      À direita da linha do radônio fica a caixa técnica com a fonte, o Arduino e o cooler, reconstruída a partir do arquivo de corte.
      A visualização plana oferece a tabela completa como grade navegável por teclado.
    </div>
  );
}

export function A11yPanel() {
  const s = useStore();
  const links = getQrLinks();
  return (
    <aside className="side-panel" aria-labelledby="a11y-h" id="guia-acessibilidade">
      <h2 id="a11y-h">Acessibilidade</h2>
      <h3>Preferências</h3>
      <label className="toggle"><input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.set({ reducedMotion: e.target.checked })} /> Reduzir animações (transições instantâneas)</label>
      <label className="toggle"><input type="checkbox" checked={s.narration} onChange={(e) => { s.set({ narration: e.target.checked }); if (!e.target.checked) window.speechSynthesis?.cancel(); }} /> Narração por voz com legendas (pt-BR)</label>
      <div className="row" role="group" aria-label="Tamanho do texto">
        {[1, 1.25, 1.5].map((v) => (
          <button key={v} className={`chip ${s.textScale === v ? 'on' : ''}`} aria-pressed={s.textScale === v} onClick={() => s.set({ textScale: v })}>Texto {v * 100}%</button>
        ))}
      </div>
      <div className="row">
        <button className="chip" onClick={() => s.set({ view: 'flat', phase: s.selected ? 'out' : 'none' })}>Abrir alternativa textual (tabela plana)</button>
        <button className="chip" onClick={() => s.cameraCmd('board')}>Ver placa informativa</button>
      </div>

      <h3>Guia de acessibilidade</h3>
      <p>A instalação física identifica cada elemento com plaquinha em alto-relevo e braile, e a placa informativa traz todos os textos em braile. Nesta simulação:</p>
      <ul>
        <li><b>Tab</b> leva às ferramentas, à cena 3D e aos painéis; todos os controles são botões com nome acessível.</li>
        <li>Na cena 3D: <b>setas</b> navegam entre elementos, <b>Enter</b> retira o elemento do nicho, <b>Esc</b> devolve ou encerra a inspeção de uma caixa, <b>1–4</b> acionam os botões de arcade, <b>0</b> acende todos, <b>R</b> recentraliza, <b>+/−</b> zoom, <b>E</b> explode as peças, <b>I</b> mostra o interior, <b>L</b> acende/apaga o LED.</li>
        <li>A visualização <b>Plana</b> é uma grade navegável com rótulos completos para leitores de tela.</li>
        <li>A narração usa a síntese de voz do navegador; o texto falado aparece como legenda.</li>
        <li>Os pontos braile em 3D são uma representação visual: não substituem o material tátil. A transcrição em braile Unicode aparece no painel de cada elemento.</li>
      </ul>

      <h3>Textos da placa informativa</h3>
      <p><b>{BOARD_TEXT.title}</b> <span aria-label="em braile">{toBrailleUnicode(BOARD_TEXT.title)}</span></p>
      <p>{BOARD_TEXT.p1}</p>
      <p>{BOARD_TEXT.p2}</p>

      <h3>Referências</h3>
      <ul>
        <li><a href={PROJECT_LINKS.article} target="_blank" rel="noopener noreferrer">Artigo: Tabela Periódica Acessível — Revista de Estudos Interdisciplinares, v. 8 n. 1, 2026</a></li>
        <li><a href={PROJECT_LINKS.manualMaker} target="_blank" rel="noopener noreferrer">Projeto no Manual Maker (materiais, etapas e arquivos de corte)</a></li>
        {PROJECT_LINKS.repo && <li><a href={PROJECT_LINKS.repo} target="_blank" rel="noopener noreferrer">Código-fonte</a></li>}
        {PROJECT_LINKS.demo && <li><a href={PROJECT_LINKS.demo} target="_blank" rel="noopener noreferrer">Aplicação publicada</a></li>}
      </ul>
      <h3>QR Codes</h3>
      {links.some((l) => l.id === 'acessibilidade' && accessibilityQrIsLocal(l.url)) && (
        <p className="hint">O QR do guia de acessibilidade aponta para um endereço local. Ao publicar, defina VITE_DEMO_URL ou VITE_QR_ACESSIBILIDADE.</p>
      )}
      <div className="qr-grid">
        {links.map((l) => <QrCard key={l.id} label={l.label} url={l.url} note={l.note} />)}
      </div>
    </aside>
  );
}
