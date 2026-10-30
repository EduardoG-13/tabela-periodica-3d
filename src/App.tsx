import { lazy, Suspense, useEffect, useRef } from 'react';
import { useStore, type AppMode } from './state/store';
import { getElement } from './data/elements';
import { neighbor } from './lib/layout';
import { BUTTON_GROUPS } from './config/buttonGroups';
import { Sidebar } from './ui/Sidebar';
import { InfoPanel, speakElement } from './ui/InfoPanel';
import { BottomControls, ModuleControls } from './ui/Controls';
import { FlatTable } from './ui/FlatTable';
import { EngineeringPanel } from './ui/EngineeringPanel';
import { A11yPanel, SceneDescription } from './ui/A11yPanel';

const Scene = lazy(() => import('./scene/Scene').then((m) => ({ default: m.Scene })));

const MODES: [AppMode, string][] = [['explorar', 'Explorar'], ['iluminacao', 'Iluminação'], ['engenharia', 'Engenharia'], ['acessibilidade', 'Acessibilidade']];

function TopBar() {
  const view = useStore((s) => s.view);
  const mode = useStore((s) => s.mode);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const setMode = (m: AppMode) => {
    const st = useStore.getState();
    useStore.setState({ mode: m, a11yOpen: m === 'acessibilidade', electronics: m === 'engenharia' ? (st.electronics === 'off' ? 'normal' : st.electronics) : 'off' });
    if (st.view === '3d') {
      if (m === 'iluminacao') st.cameraCmd('buttons');
      if (m === 'acessibilidade') st.cameraCmd('board');
      if (m === 'explorar') st.cameraCmd('home');
    }
  };
  return (
    <header className="topbar">
      <button className="burger" aria-expanded={sidebarOpen} aria-controls="sidebar" onClick={() => useStore.setState({ sidebarOpen: !sidebarOpen })}>
        Menu<span className="sr-only"> de ferramentas</span>
      </button>
      <h1>Tabela Periódica Interativa e Acessível <small>gêmeo digital 3D</small></h1>
      <div className="seg" role="group" aria-label="Tipo de visualização">
        <button aria-pressed={view === '3d'} className={view === '3d' ? 'on' : ''} onClick={() => useStore.setState((st) => ({ view: '3d', phase: st.selected ? 'extracting' : 'none' }))}>3D</button>
        <button aria-pressed={view === 'flat'} className={view === 'flat' ? 'on' : ''} onClick={() => useStore.setState((st) => ({ view: 'flat', phase: st.selected ? 'out' : 'none' }))}>Plana</button>
      </div>
      <nav className="seg modes" aria-label="Modos">
        {MODES.map(([m, l]) => (
          <button key={m} aria-pressed={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{l}</button>
        ))}
      </nav>
    </header>
  );
}

/** Teclado na cena 3D: setas movem o foco entre elementos, Enter retira, Esc devolve */
function useSceneKeys() {
  return (ev: React.KeyboardEvent) => {
    const st = useStore.getState();
    const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const;
    const dir = dirs[ev.key as keyof typeof dirs];
    if (dir) {
      ev.preventDefault();
      const n = st.focused ? neighbor(st.focused, dir) : 1;
      useStore.setState({ focused: n });
      const e = getElement(n);
      st.say(`${e.name}, ${e.symbol}, ${e.number}`);
      return;
    }
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      if (st.focused) {
        st.select(st.focused);
        speakElement(getElement(st.focused));
      }
    } else if (ev.key === 'Escape') st.returnToNiche();
    else if (ev.key === '+' || ev.key === '=') st.cameraCmd('zoomIn');
    else if (ev.key === '-') st.cameraCmd('zoomOut');
    else if (ev.key.toLowerCase() === 'r') st.cameraCmd('home');
    else if (ev.key.toLowerCase() === 'l' && st.selected) st.toggleLed(st.selected);
    else if (ev.key.toLowerCase() === 'e' && st.phase === 'out') useStore.setState({ exploded: !st.exploded });
    else if (ev.key.toLowerCase() === 'i' && st.phase === 'out') useStore.setState({ interior: !st.interior });
    else if (/^[1-4]$/.test(ev.key)) st.pressGroup(BUTTON_GROUPS[Number(ev.key) - 1].id);
    else if (ev.key === '0') st.pressGroup('todos');
  };
}

function RightPanel() {
  const a11y = useStore((s) => s.a11yOpen);
  const mode = useStore((s) => s.mode);
  if (a11y) return <A11yPanel />;
  if (mode === 'engenharia') return <EngineeringPanel />;
  return <InfoPanel />;
}

export default function App() {
  const view = useStore((s) => s.view);
  const caption = useStore((s) => s.caption);
  const narration = useStore((s) => s.narration);
  const textScale = useStore((s) => s.textScale);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const onKeys = useSceneKeys();
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textScale * 100}%`;
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [textScale, reducedMotion]);

  useEffect(() => {
    // gancho de depuração/testes automatizados: ?debug na URL ou modo dev
    if (import.meta.env.DEV || window.location.search.includes('debug')) (window as unknown as { __store: typeof useStore }).__store = useStore;
    if (window.location.hash === '#guia-acessibilidade') useStore.setState({ a11yOpen: true, mode: 'acessibilidade' });
    if (import.meta.env.DEV) import('./data/validate').then(({ validateElements }) => {
      const errs = validateElements();
      if (errs.length) console.error('Problemas na base de dados:', errs);
    });
  }, []);

  return (
    <div className="app">
      <a href="#cena" className="skip">Pular para a tabela</a>
      <TopBar />
      <div className="main">
        <Sidebar />
        <main id="cena" className="stage" aria-label="Área central">
          {view === '3d' ? (
            <div
              ref={sceneRef}
              className="scene"
              tabIndex={0}
              role="application"
              aria-roledescription="cena 3D interativa"
              aria-label="Tabela periódica em 3D. Setas: navegar entre elementos. Enter: retirar do nicho. Esc: devolver. 1 a 4: botões dos grupos, 0: todos. R: recentralizar. Mais e menos: zoom. E: explodir peças, I: interior, L: LED."
              aria-describedby="scene-desc"
              onKeyDown={onKeys}
            >
              <Suspense fallback={<div className="loading">Carregando cena 3D…</div>}>
                <Scene />
              </Suspense>
              <ModuleControls />
              <BottomControls />
            </div>
          ) : (
            <FlatTable />
          )}
          <SceneDescription />
        </main>
        <RightPanel />
      </div>
      <div className={`caption ${caption && (narration || caption) ? 'show' : ''}`} role="status" aria-live="polite">
        {caption}
      </div>
    </div>
  );
}
