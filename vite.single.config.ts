// Build "arquivo único": gera dist-single/index.html com JS, CSS e fontes embutidos.
// Pode ser aberto com duplo clique, sem servidor.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: { outDir: 'dist-single', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 },
});
