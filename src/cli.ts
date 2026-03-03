#!/usr/bin/env bun

const VERSION = '0.2.0';

const HELP = `
  figma-pilot — CLI for Figma Pilot MCP

  Usage:
    figma-pilot <command> [options]

  Commands:
    init      Install dependencies and build the plugin
    build     Build the Figma plugin
    start     Start the server (--mode=all|mcp|ws)
    doctor    Run diagnostics checks
    help      Show this help message

  Options:
    --version  Show version
    --help     Show this help message
`;

const command = process.argv[2];

if (command === '--version' || command === '-v') {
  console.log(VERSION);
  process.exit(0);
}

if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(HELP);
  process.exit(0);
}

const commands: Record<string, () => Promise<void>> = {
  async init() {
    const { init } = await import('./cli/init.ts');
    const success = await init();
    process.exit(success ? 0 : 1);
  },
  async build() {
    const { buildPlugin } = await import('./cli/build.ts');
    const success = await buildPlugin();
    process.exit(success ? 0 : 1);
  },
  async start() {
    const { start } = await import('./cli/start.ts');
    await start();
  },
  async doctor() {
    const { doctor } = await import('./cli/doctor.ts');
    const passed = await doctor();
    process.exit(passed ? 0 : 1);
  },
};

const handler = commands[command];
if (!handler) {
  console.error(`Unknown command: ${command}\n`);
  console.log(HELP);
  process.exit(1);
}

handler().catch((error) => {
  console.error(error);
  process.exit(1);
});
