import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vuePlugin from 'eslint-plugin-vue';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Create require function for resolving parser paths
const require = createRequire(import.meta.url);

export default [
  js.configs.recommended,
  
  // Ignore patterns
  {
    ignores: ['**/dist'],
  },
  
  // Vue files configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: require('vue-eslint-parser'),
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      vue: vuePlugin,
    },
    rules: {
      // Individual Vue rules
      'vue/multi-word-component-names': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/valid-template-root': 'error',
      'vue/html-indent': ['error', 2],
      'vue/html-self-closing': 'warn',
    },
  },
  
  // TS/JS files configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'unicode-bom': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  
  // Frontend specific overrides
  {
    files: ['apps/frontend/**/*.ts', 'apps/frontend/**/*.js'],
    rules: {},
  },
];
