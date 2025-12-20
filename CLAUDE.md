# Figma Pilot MCP

An MCP server that gives AI full control over Figma — read, create, and modify designs.

## Development

Use Bun for all commands:

```sh
bun install          # Install dependencies
bun run dev          # Start server with watch mode
bun run start        # Start server
bun run build        # Build server for production
bun run build:plugin # Build Figma plugin
bun run typecheck    # Type check server code
bun run typecheck:plugin  # Type check plugin code
bun run lint         # Run ESLint
bun run lint:fix     # Fix lint errors
```

## Project Structure

- `src/server.ts` - MCP server entry point
- `src/tools/` - MCP tool definitions
- `src/plugin/` - Figma plugin (code.ts, ui.html, manifest.json)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/config/` - Configuration

## Conventions

- Use Bun APIs (`Bun.serve()`, `Bun.file()`, etc.) instead of Node.js equivalents
- Use `@modelcontextprotocol/sdk` for MCP server implementation
- Use `zod` for schema validation
- WebSocket communication between MCP server and Figma plugin
- Follow existing code patterns in `src/tools/` when adding new tools
