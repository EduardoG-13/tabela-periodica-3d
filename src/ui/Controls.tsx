import { isLit, useStore, type ModuleFace } from '../state/store';

/** Controles do módulo retirado do nicho */
export function ModuleControls() {
  const selected = useStore((s) => s.selected);
  const phase = useStore((s) => s.phase);
  const autoRotate = useStore((s) => s.autoRotate);
  const interior = useStore((s) => s.interior);
  const exploded = useStore((s) => s.exploded);
  const lit = useStore((s) => (s.selected ? isLit(s, s.selected) : false));
  if (!selected || phase === 'none' || phase === 'returning') return null;
  const st = useStore.getState;
  const faces: [ModuleFace, string][] = [['frente', 'Frente'], ['tras', 'Trás'], ['esquerda', 'Lateral esq.'], ['direita', 'Lateral dir.'], ['topo', 'Topo'], ['base', 'Base']];
  return (
    <div className="module-controls" role="toolbar" aria-label="Controles do módulo retirado">
      <button aria-pressed={autoRotate} className={autoRotate ? 'on' : ''} onClick={() => useStore.setState({ autoRotate: !autoRotate })}>Girar módulo</button>
      <button aria-pressed={interior} className={interior ? 'on' : ''} onClick={() => { useStore.setState({ interior: !interior }); st().say(interior ? 'Paredes opacas.' : 'Interior visível: fita LED, tampo inferior e fios.'); }}>Visualizar interior</button>
      <button aria-pressed={exploded} className={exploded ? 'on' : ''} onClick={() => { useStore.setState({ exploded: !exploded, selectedPart: null }); st().say(exploded ? 'Remontando a caixa.' : 'Vista explodida: clique em uma peça para ver seus detalhes.'); }}>{exploded ? 'Remontar peças' : 'Explodir peças'}</button>
      <button aria-pressed={lit} className={lit ? 'on' : ''} onClick={() => st().toggleLed(selected)}>{lit ? 'Apagar LED' : 'Acender LED'}</button>
      <button className="primary" onClick={() => st().returnToNiche()}>Voltar ao nicho</button>
      <span className="sep" aria-hidden />
      <span className="faces" role="group" aria-label="Ver face do módulo">
        {faces.map(([f, l]) => <button key={f} onClick={() => st().setFace(f)}>{l}</button>)}
      </span>
      <p className="hint">Arraste o módulo para girá-lo em qualquer direção.</p>
    </div>
  );
}

/** Controles inferiores da câmera */
export function BottomControls() {
  const orbit = useStore((s) => s.cameraOrbit);
  const phase = useStore((s) => s.phase);
  const autoRotate = useStore((s) => s.autoRotate);
  const st = useStore.getState;
  const rotating = phase === 'out' ? autoRotate : orbit;
  return (
    <nav className="bottom-controls" aria-label="Câmera">
      <button onClick={() => st().cameraCmd('zoomIn')} aria-label="Aproximar (zoom +)">Zoom +</button>
      <button onClick={() => st().cameraCmd('zoomOut')} aria-label="Afastar (zoom −)">Zoom −</button>
      <button onClick={() => st().cameraCmd('home')}>Recentralizar câmera</button>
      <button aria-pressed={rotating} className={rotating ? 'on' : ''} onClick={() => (phase === 'out' ? useStore.setState({ autoRotate: !autoRotate }) : useStore.setState({ cameraOrbit: !orbit }))}>Girar</button>
      <button disabled={phase === 'none'} onClick={() => st().returnToNiche()}>Retornar ao nicho</button>
      <button onClick={() => st().cameraCmd('front')}>Visão frontal</button>
      <button onClick={() => st().cameraCmd('back')}>Visão traseira</button>
    </nav>
  );
}
