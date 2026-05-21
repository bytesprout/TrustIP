const baseConfig = require('@trustip/eslint-config');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Source files — full type-aware linting
  {
    ...baseConfig[0],
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    languageOptions: {
      ...baseConfig[0].languageOptions,
      parserOptions: {
        ...baseConfig[0].languageOptions.parserOptions,
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
    },
  },
  // Spec files — basic linting without type-aware rules
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'jest.config.js'],
  },
];
