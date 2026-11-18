import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/extension.web.ts'],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  outfile: 'dist/web/extension.js',
  external: ['vscode'],
  sourcemap: production ? false : 'inline',
  minify: production,
  define: { global: 'globalThis' },
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('[watch] esbuild watching src/extension.web.ts');
} else {
  await build(options);
}
