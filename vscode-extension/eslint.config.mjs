import pluginJs from '@eslint/js';
import airbnbTypescript from 'eslint-config-airbnb-typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  airbnbTypescript,
  {
    rules: {},
  },
];
