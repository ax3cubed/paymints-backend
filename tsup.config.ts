import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  clean: true,
  loader: {
    '.log': 'text', // Configure .log files as text
  },
});
