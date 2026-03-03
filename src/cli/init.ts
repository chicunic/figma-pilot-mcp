import { buildPlugin } from './build.ts';
import { checkBunVersion, fail, fmt, info, ok, runCmd } from './utils.ts';

export async function init(): Promise<boolean> {
  console.log(fmt.bold('\nInitializing Figma Pilot...\n'));

  // 1. Check Bun
  if (!(await checkBunVersion())) {
    fail('Bun is required. Install from https://bun.sh');
    return false;
  }

  // 2. Install dependencies
  console.log('');
  info('Installing dependencies...');
  if (!(await runCmd(['bun', 'install']))) {
    fail('Failed to install dependencies');
    return false;
  }
  ok('Dependencies installed');

  // 3. Build plugin
  if (!(await buildPlugin())) {
    fail('Failed to build plugin');
    return false;
  }

  // 4. Next steps
  console.log(fmt.bold('\n  Next steps:\n'));
  console.log('  1. Import the Figma plugin:');
  console.log(`     ${fmt.dim('Figma → Plugins → Development → Import plugin from manifest')}`);
  console.log(`     ${fmt.dim('Select:')} dist/plugin/manifest.json`);
  console.log('');
  console.log('  2. Configure your MCP client:');
  console.log(`     ${fmt.dim('See README.md for configuration examples')}`);
  console.log('');
  console.log('  3. Start the server:');
  console.log(`     ${fmt.dim('figma-pilot start')}`);
  console.log('');

  return true;
}

if (import.meta.main) {
  const success = await init();
  process.exit(success ? 0 : 1);
}
