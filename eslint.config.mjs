import js from '@eslint/js';

export default [

  {
    ignores: ['node_modules/**', 'test-results/**', 'testing/reports/**'],
  },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        console: 'readonly',
      },
      
    },

    rules: {
      'no-undef': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-empty': 'off',
    },

  },

];
