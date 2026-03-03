import type { RunMode } from '../server.ts';
import { fmt, info } from './utils.ts';

function parseModeArg(): RunMode | null {
  const arg = process.argv.find((a) => a.startsWith('--mode='));
  if (!arg) return null;
  const value = arg.split('=')[1];
  if (value === 'all' || value === 'mcp' || value === 'ws') return value;
  console.error(`Invalid mode: ${value}. Use all|mcp|ws`);
  process.exit(1);
}

export async function start(): Promise<void> {
  const mode = parseModeArg() ?? 'all';

  info(`Starting in ${fmt.bold(mode)} mode...`);
  console.log('');

  const { startAll, startWsOnly, startMcpOnly } = await import('../server.ts');

  switch (mode) {
    case 'all':
      await startAll();
      break;
    case 'ws':
      await startWsOnly();
      break;
    case 'mcp':
      await startMcpOnly();
      break;
  }
}

if (import.meta.main) {
  start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
