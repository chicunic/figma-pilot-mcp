import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fail, fmt, ok } from './utils.ts';

export async function buildPlugin(): Promise<boolean> {
  console.log(fmt.bold('\nBuilding Figma plugin...\n'));

  const distDir = resolve('dist/plugin');
  mkdirSync(distDir, { recursive: true });

  // esbuild bundle
  const esbuild = Bun.spawn(
    [
      'bunx',
      'esbuild',
      'src/plugin/code.ts',
      '--bundle',
      `--outfile=${distDir}/code.js`,
      '--target=es2018',
      '--format=iife',
    ],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  const exitCode = await esbuild.exited;
  if (exitCode !== 0) {
    fail('esbuild failed');
    return false;
  }

  // Copy manifest.json and ui.html
  const srcDir = resolve('src/plugin');
  for (const file of ['manifest.json', 'ui.html']) {
    await Bun.write(resolve(distDir, file), Bun.file(resolve(srcDir, file)));
  }

  ok('Plugin built → dist/plugin/');
  return true;
}

// Allow direct execution
if (import.meta.main) {
  const success = await buildPlugin();
  process.exit(success ? 0 : 1);
}
