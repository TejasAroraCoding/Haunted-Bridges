import js from '@eslint/js';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';

export default [
  { ignores: ['dist/', 'dist-*/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    plugins: { 'import-x': importX },
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: {
      // Catch imports of names a module doesn't export, missing files and cycles-in-waiting.
      'import-x/named': 'error',
      'import-x/no-unresolved': ['error', { ignore: ['^@fontsource/'] }],
      'import-x/no-duplicates': 'error',
      'import-x/no-self-import': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Service-worker template: placeholders are filled in at build time by vite.config.js.
    files: ['src/pwa/sw-template.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker, __PRECACHE_LIST__: 'readonly' },
    },
  },
  {
    files: ['*.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
  },
  {
    // Playwright tests run in Node but pass callbacks into the page, so both sets of globals apply.
    files: ['tests/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
