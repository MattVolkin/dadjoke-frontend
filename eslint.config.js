import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    // ESLint's own flat config is an ES module.
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    // Tests run in Node with the built-in test runner (node --test) + jsdom.
    files: ['test/**/*.js', '**/*.test.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
];
