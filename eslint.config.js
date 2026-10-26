import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** Límites duros del proyecto. Ver docs/DEVELOPMENT.md. */
const NESTED_LOOP_RULE = {
  selector:
    'ForStatement :matches(ForStatement, ForOfStatement, ForInStatement, WhileStatement, DoWhileStatement)',
  message:
    'Bucles anidados prohibidos: extrae una función auxiliar o usa una utilidad ya encapsulada.',
};
const NESTED_LOOP_RULES = [
  NESTED_LOOP_RULE,
  ...['ForOfStatement', 'ForInStatement', 'WhileStatement', 'DoWhileStatement'].map((outer) => ({
    selector: `${outer} :matches(ForStatement, ForOfStatement, ForInStatement, WhileStatement, DoWhileStatement)`,
    message:
      'Bucles anidados prohibidos: extrae una función auxiliar o usa una utilidad ya encapsulada.',
  })),
];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': [
        'error',
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-statements': ['error', 20],
      'no-restricted-syntax': ['error', ...NESTED_LOOP_RULES],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'max-depth': 'off',
    },
  },
  {
    files: ['*.config.ts', '*.config.js'],
    rules: {
      'max-lines': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
