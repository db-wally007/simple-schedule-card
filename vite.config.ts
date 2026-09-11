import { defineConfig } from 'vite';

// Single-file ESM build for Lovelace resource use. lit is bundled so the file
// works as a standalone /local/ resource — HA does not reliably expose bare
// specifiers (like "lit") to dashboard resources.
export default defineConfig({
  // Force esbuild to use LEGACY TypeScript decorators. Lit 3 reactive decorators
  // (@customElement/@property/@state) require experimentalDecorators +
  // useDefineForClassFields:false; without this esbuild compiles them as TC39
  // standard decorators, which breaks the card at runtime ("Configuration error").
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'es2021',
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  build: {
    lib: {
      entry: 'src/card.ts',
      name: 'SimpleScheduleCard',
      fileName: () => 'simple-schedule-card.js',
      formats: ['es'],
    },
    rollupOptions: {
      external: [], // bundle all dependencies
    },
    outDir: 'dist',
    sourcemap: false,
    target: 'es2021',
    minify: 'esbuild',
  },
});
