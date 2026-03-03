import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ==================== ANSI Colors ====================

const esc = (code: string) => `\x1b[${code}m`;
const reset = esc('0');

export const fmt = {
  green: (s: string) => `${esc('32')}${s}${reset}`,
  red: (s: string) => `${esc('31')}${s}${reset}`,
  yellow: (s: string) => `${esc('33')}${s}${reset}`,
  bold: (s: string) => `${esc('1')}${s}${reset}`,
  dim: (s: string) => `${esc('2')}${s}${reset}`,
};

// ==================== Output Helpers ====================

export const ok = (msg: string) => console.log(`  ${fmt.green('✔')} ${msg}`);
export const fail = (msg: string) => console.log(`  ${fmt.red('✘')} ${msg}`);
export const warn = (msg: string) => console.log(`  ${fmt.yellow('!')} ${msg}`);
export const info = (msg: string) => console.log(`  ${fmt.dim('·')} ${msg}`);

// ==================== Check Functions ====================

export async function checkBunVersion(): Promise<boolean> {
  try {
    const proc = Bun.spawn(['bun', '--version'], { stdout: 'pipe', stderr: 'pipe' });
    const text = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    if (exitCode !== 0) return false;
    const version = text.trim();
    ok(`Bun ${version}`);
    return true;
  } catch {
    fail('Bun not found');
    return false;
  }
}

export function checkDepsInstalled(): boolean {
  const dir = resolve('node_modules');
  if (existsSync(dir)) {
    ok('Dependencies installed');
    return true;
  }
  fail('Dependencies not installed (run `bun install`)');
  return false;
}

export function checkPluginBuilt(): boolean {
  const manifest = resolve('dist/plugin/manifest.json');
  if (existsSync(manifest)) {
    ok('Plugin built');
    return true;
  }
  fail('Plugin not built (run `figma-pilot build`)');
  return false;
}

export async function checkPortAvailable(port: number): Promise<boolean> {
  try {
    const server = Bun.serve({ port, fetch: () => new Response() });
    server.stop(true);
    ok(`Port ${port} available`);
    return true;
  } catch {
    fail(`Port ${port} in use`);
    return false;
  }
}

export async function runCmd(cmd: string[]): Promise<boolean> {
  try {
    const proc = Bun.spawn(cmd, { stdout: 'inherit', stderr: 'inherit' });
    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch {
    return false;
  }
}
