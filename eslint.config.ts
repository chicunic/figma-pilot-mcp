import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import * as figmaPlugin from '@figma/eslint-plugin-figma-plugins';
import { defineConfig } from 'eslint/config';
import type { Config, Plugin } from '@eslint/config-helpers';

export default defineConfig(
  {
    ignores: ['src/plugin/*.js'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['src/plugin/**'],
  },
  {
    files: ['src/plugin/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './src/plugin/tsconfig.json',
      },
    },
    plugins: {
      '@figma/figma-plugins': figmaPlugin as Plugin,
    },
    rules: figmaPlugin.flatConfigs.recommended.rules,
  } as Config
);
