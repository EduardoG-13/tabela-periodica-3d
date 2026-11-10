#!/usr/bin/env node
/**
 * QA funcional + capturas para divulgação.
 *
 * Uso:
 *   npm run build
 *   npm run qa                 # testes + capturas em ./capturas
 *   npm run qa -- --no-shots   # só os testes
 *   npm run qa -- --out=pasta  # outra pasta de saída
 *
 * Serve a pasta dist/ num servidor estático próprio (não precisa de `vite preview`),
 * abre a página com ?debug (expõe window.__store e window.__three) e percorre
 * a jornada principal. Sai com código 1 se algum teste falhar ou houver erro de página.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve('dist');
const args = process.argv.slice(2);
const SHOTS = !args.includes('--no-shots');
const OUT = resolve(args.find((a) => a.startsWith('--out='))?.slice(6) ?? 'capturas');
const LOAD_TIMEOUT = 180_000; // SwiftShader (sem GPU) é lento; em máquina comum carrega em poucos segundos

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error('dist/index.html não encontrado. Rode `npm run build` antes.');
  process.exit(1);
}

// ---------- servidor estático ----------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/?debug`;

// ---------- utilitários ----------
const results = [];
async function test(name, fn) {
  const t0 = Date.now();
  try { await fn(); results.push({ name, ok: true }); console.log(`  ok   ${name} (${Date.now() - t0} ms)`); }
  catch (e) { results.push({ name, ok: false, err: e.message }); console.log(`  FALHA ${name}: ${e.message}`); }
}
const assert = (c, msg) => { if (!c) throw new Error(msg); };
const state = (page, expr) => page.evaluate(`(() => { const s = window.__store.getState(); return ${expr}; })()`);
const waitState = (page, expr, timeout = 60_000) =>
  page.waitForFunction(`(() => { const s = window.__store?.getState(); return s && (${expr}); })()`, null, { timeout, polling: 250 });

/** Espera a cena montar: número de malhas estável por 5 leituras seguidas. */
async function waitScene(page) {
  await page.waitForSelector('canvas', { timeout: LOAD_TIMEOUT });
  await page.waitForFunction('window.__three && window.__store', null, { timeout: LOAD_TIMEOUT });
  const deadline = Date.now() + LOAD_TIMEOUT;
  let last = -1, stable = 0;
  while (Date.now() < deadline) {
    const n = await page.evaluate(() => { let c = 0; window.__three.get().scene.traverse((o) => { if (o.isMesh) c++; }); return c; });
    stable = n > 200 && n === last ? stable + 1 : 0;
    last = n;
    if (stable >= 5) return n;
    await page.waitForTimeout(1500);
  }
  throw new Error(`cena não estabilizou (malhas: ${last})`);
}

const HIDE_UI = 'header,.topbar,.sidebar,.right-panel,.module-controls,.bottom-controls,.caption,aside{display:none!important}.scene,.scene:focus,.scene:focus-visible{outline:none!important}';
async function shot(page, name, { camera, hideUi = true } = {}) {
  if (!SHOTS) return;
  await page.evaluate((css) => { document.getElementById('cap')?.remove(); if (css) { const s = document.createElement('style'); s.id = 'cap'; s.textContent = css; document.head.append(s); } }, hideUi ? HIDE_UI : '');
  await page.evaluate(() => { document.activeElement?.blur?.(); window.dispatchEvent(new Event('resize')); });
  await page.waitForTimeout(1000); // o canvas se ajusta à nova largura
  if (camera) {
    await page.evaluate(([p, t]) => window.__three.get().controls?.setLookAt(...p, ...t, false), camera);
  }
  await page.waitForTimeout(2500); // alguns quadros para sombras/LEDs assentarem
  await page.screenshot({ path: join(OUT, name), timeout: LOAD_TIMEOUT });
  await page.evaluate(() => document.getElementById('cap')?.remove());
  console.log(`       captura ${name}`);
}

// ---------- execução ----------
if (SHOTS) await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pageErrors = [];
const consoleErrors = [];
const watch = (page) => {
  page.setDefaultTimeout(LOAD_TIMEOUT);
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
};

console.log('Desktop 1920×1004');
const page = await browser.newPage({ viewport: { width: 1920, height: 1004 } });
watch(page);
const t0 = Date.now();
await page.goto(BASE);

await test('cena 3D carrega', async () => {
  const meshes = await waitScene(page);
  console.log(`       ${meshes} malhas em ${Date.now() - t0} ms`);
});

await shot(page, 'linkedin-capa-01.png', { camera: [[-3.5, 1.55, 2.45], [-0.4, 1.2, 0]] });
await shot(page, 'linkedin-geral-02.png', { camera: [[-0.3, 1.33, 4.15], [-0.3, 1.3, 0]] });
await shot(page, 'linkedin-perspectiva-03.png', { camera: [[2.6, 1.45, 2.7], [0.1, 1.15, 0]] });
await shot(page, 'linkedin-detalhe-05.png', { camera: [[-1.12, 1.44, 0.62], [-1.3, 1.33, 0.12]] });
await page.evaluate(() => window.__store.getState().cameraCmd('home'));
// Movimento reduzido (opção do próprio app): animações instantâneas, testes independentes do FPS.
await page.evaluate(() => window.__store.setState({ reducedMotion: true }));

await test('teclado: setas, grupos, Enter e Esc', async () => {
  await page.focus('.scene');
  await page.keyboard.press('ArrowRight');
  assert((await state(page, 's.focused')) !== null, 'seta não moveu o foco');
  await page.keyboard.press('2');
  assert((await state(page, 's.activeGroup')) === 'metais', 'tecla 2 não acendeu metais');
  await page.keyboard.press('0');
  assert((await state(page, 's.activeGroup')) === 'todos', 'tecla 0 não acendeu todos');
  await page.keyboard.press('Enter');
  await waitState(page, "s.phase === 'extracting' || s.phase === 'out'", 10_000);
  await waitState(page, "s.phase === 'out'");
  await page.keyboard.press('Escape');
  await waitState(page, "s.phase === 'none'");
});

await test('botões físicos: cada grupo acende só o seu', async () => {
  for (const g of ['hidrogenio', 'metais', 'ametais', 'gases', 'todos']) {
    await page.evaluate((id) => window.__store.getState().pressGroup(id), g);
    assert((await state(page, 's.activeGroup')) === g, `grupo ${g} não ativou`);
  }
});

await test('selecionar Ouro: retirar, painel, explodir, voltar', async () => {
  // a legenda é temporária (some em poucos segundos): registra todas as legendas emitidas
  await page.evaluate(() => {
    window.__captions = [];
    window.__store.subscribe((s, o) => { if (s.caption && s.caption !== o.caption) window.__captions.push(s.caption); });
    window.__store.getState().select(79);
  });
  await waitState(page, "s.phase === 'out' && s.selected === 79");
  const caps = await page.evaluate(() => window.__captions);
  assert(caps.some((c) => c.includes('Ouro')), 'legenda não anunciou o elemento');
  assert(await page.getByText('Ouro').first().isVisible(), 'painel de informação sem o nome');
});
const AU_CAM = [[0.29, 1.1, 1.0], [0.29, 1.0, 0.25]]; // Ouro retirado, centrado diante do próprio nicho
await shot(page, 'linkedin-elemento-04.png', { camera: AU_CAM });
await shot(page, 'linkedin-interface-07.png', { camera: AU_CAM, hideUi: false });
await test('vista explodida', async () => {
  await page.evaluate(() => window.__store.setState({ exploded: true }));
  await page.waitForTimeout(1500);
  assert(await state(page, 's.exploded'), 'não explodiu');
});
await shot(page, 'linkedin-explodida-06.png');
await test('voltar ao nicho', async () => {
  await page.evaluate(() => window.__store.getState().returnToNiche());
  await waitState(page, "s.phase === 'none'");
});

await test('inspeção da caixa de botões e da caixa técnica', async () => {
  for (const t of ['botoes', 'tecnica']) {
    await page.evaluate((x) => window.__store.getState().openInspect(x), t);
    await waitState(page, `s.inspect === '${t}'`, 5000);
    if (t === 'botoes') await shot(page, 'linkedin-botoes-09.png');
    await page.evaluate(() => window.__store.getState().closeInspect());
    await waitState(page, "s.inspect === 'none'", 5000);
  }
});

await test('guia de acessibilidade com braille', async () => {
  await page.evaluate(() => window.__store.setState({ a11yOpen: true, mode: 'acessibilidade' }));
  await page.waitForTimeout(800);
  const dots = await page.locator('.braille-dots circle').count();
  assert(dots > 0, 'nenhum ponto braille desenhado');
});
await shot(page, 'linkedin-acessibilidade-08.png', { hideUi: false });
await page.evaluate(() => window.__store.setState({ a11yOpen: false, mode: 'explorar' }));

await test('visão plana: 118 células e clique seleciona', async () => {
  await page.getByRole('button', { name: 'Plana', exact: true }).click();
  const cells = page.locator('.flat .cell:not(.ph)');
  await cells.first().waitFor();
  assert((await cells.count()) === 118, `células: ${await cells.count()}`);
  await cells.nth(25).click(); // Fe
  assert((await state(page, 's.selected')) === 26, 'clique não selecionou Fe');
  await page.getByRole('button', { name: '3D', exact: true }).click();
});
await page.close();

console.log('Celular 390×844');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
watch(mobile);
await mobile.goto(BASE);
await test('celular: carrega, sem rolagem horizontal, menu fechado', async () => {
  await waitScene(mobile);
  const { sw, iw } = await mobile.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  assert(sw <= iw, `rolagem horizontal (${sw} > ${iw})`);
  assert(!(await state(mobile, 's.sidebarOpen')), 'menu lateral aberto no celular');
});
await shot(mobile, 'mobile-inicio.png', { hideUi: false });
await mobile.close();

await browser.close();
server.close();

// ---------- resumo ----------
const ignored = /THREE\.Clock|GPU stall|ReadPixels/;
const realConsole = consoleErrors.filter((m) => !ignored.test(m));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} testes ok · erros de página: ${pageErrors.length} · erros de console: ${realConsole.length}`);
for (const e of [...pageErrors, ...realConsole]) console.log('  ' + e);
if (SHOTS) console.log(`Capturas em ${OUT}`);
process.exit(failed.length || pageErrors.length ? 1 : 0);
