import { config } from '../config/index.ts';
import { checkBunVersion, checkDepsInstalled, checkPluginBuilt, checkPortAvailable, fmt } from './utils.ts';

export async function doctor(): Promise<boolean> {
  console.log(fmt.bold('\nRunning diagnostics...\n'));

  const results = [
    await checkBunVersion(),
    checkDepsInstalled(),
    checkPluginBuilt(),
    await checkPortAvailable(config.socketPort),
  ];

  const allPassed = results.every(Boolean);
  console.log('');

  if (allPassed) {
    console.log(fmt.green('  All checks passed.'));
  } else {
    console.log(fmt.red('  Some checks failed.'));
  }
  console.log('');

  return allPassed;
}

if (import.meta.main) {
  const passed = await doctor();
  process.exit(passed ? 0 : 1);
}
