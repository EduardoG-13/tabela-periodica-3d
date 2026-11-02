/**
 * DESTINOS DOS QR CODES — configuráveis.
 *
 * Nenhum QR Code é gerado sem destino definido: se `url` resolver para vazio,
 * a placa mostra o quadro tracejado vazio (como na fotografia) com o aviso
 * "QR não configurado".
 *
 * Podem ser sobrescritos por variáveis de ambiente do Vite (arquivo .env):
 *   VITE_QR_HISTORIA, VITE_QR_PROJETO, VITE_QR_ACESSIBILIDADE,
 *   VITE_QR_HIDROGENIO, VITE_QR_METAIS, VITE_QR_AMETAIS, VITE_QR_GASES
 * Endereços padrão verificados (HTTP 200) em 29/10/2026.
 */
export type LinkId = 'historia' | 'projeto' | 'acessibilidade' | 'hidrogenio' | 'metais' | 'ametais' | 'gases';

export interface QrLink {
  id: LinkId;
  label: string;
  url: string;
  note: string;
}

const env = import.meta.env as Record<string, string | undefined>;
const DEMO_DEFAULT = 'https://tabela-periodica-3d-six.vercel.app/';
const demoUrl = env.VITE_DEMO_URL ?? DEMO_DEFAULT;

/** O guia de acessibilidade é uma seção real deste próprio aplicativo. */
function appSection(hash: string): string {
  if (typeof window === 'undefined') return '';
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${hash}`;
}

export function getQrLinks(): QrLink[] {
  return [
    {
      id: 'historia', label: 'História da Tabela Periódica',
      url: env.VITE_QR_HISTORIA ?? 'https://pt.wikipedia.org/wiki/Tabela_peri%C3%B3dica',
      note: 'Artigo “Tabela periódica” da Wikipédia em português.',
    },
    {
      id: 'projeto', label: 'Explicação do projeto',
      url: env.VITE_QR_PROJETO ?? 'https://www.manualmaker.com/projeto/tabela-periodica-interativa',
      note: 'Página oficial do projeto no Manual Maker (materiais, etapas e arquivos de corte).',
    },
    {
      id: 'acessibilidade', label: 'Guia de acessibilidade',
      url: env.VITE_QR_ACESSIBILIDADE ?? (demoUrl ? `${demoUrl.replace(/\/$/, '')}/#guia-acessibilidade` : appSection('guia-acessibilidade')),
      note: 'Seção “Guia de acessibilidade” da demo publicada (VITE_DEMO_URL). Sem demo definida, aponta para o endereço atual do aplicativo.',
    },
    { id: 'hidrogenio', label: 'Hidrogênio', url: env.VITE_QR_HIDROGENIO ?? 'https://pt.wikipedia.org/wiki/Hidrog%C3%AAnio', note: 'Wikipédia: Hidrogênio.' },
    { id: 'metais', label: 'Metais', url: env.VITE_QR_METAIS ?? 'https://pt.wikipedia.org/wiki/Metal', note: 'Wikipédia: Metal.' },
    { id: 'ametais', label: 'Ametais', url: env.VITE_QR_AMETAIS ?? 'https://pt.wikipedia.org/wiki/N%C3%A3o_metal', note: 'Wikipédia: Não metal (ametal).' },
    { id: 'gases', label: 'Gases Nobres', url: env.VITE_QR_GASES ?? 'https://pt.wikipedia.org/wiki/G%C3%A1s_nobre', note: 'Wikipédia: Gás nobre.' },
  ];
}

/**
 * Links do projeto. Repositório e demo publicados e listados na página do Manual Maker;
 * ambos responderam HTTP 200 em outubro de 2026. Podem ser trocados por VITE_REPO_URL e
 * VITE_DEMO_URL (defina como string vazia para ocultar).
 */
export const PROJECT_LINKS = {
  manualMaker: env.VITE_MANUALMAKER_URL ?? 'https://www.manualmaker.com/projeto/tabela-periodica-interativa',
  article: env.VITE_ARTICLE_URL ?? 'https://doi.org/10.56579/rei.v8i1.2479',
  repo: env.VITE_REPO_URL ?? 'https://github.com/EduardoG-13/tabela-periodica-3d',
  demo: env.VITE_DEMO_URL ?? DEMO_DEFAULT,
};

/** Em produção, o QR do guia de acessibilidade não pode apontar para localhost */
export function accessibilityQrIsLocal(url: string): boolean {
  return url.startsWith("file:") || /\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(url);
}
