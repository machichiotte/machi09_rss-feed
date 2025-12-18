import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                // Node.js globals
                process: 'readonly',
                console: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            // Complexité cyclomatique max: 10
            'complexity': ['error', { max: 10 }],

            // Autres règles de qualité
            'max-depth': ['error', 4],
            'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
            'max-nested-callbacks': ['error', 3],

            // TypeScript
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',

            // Désactiver certaines règles trop strictes
            'no-unused-vars': 'off', // Utiliser la version TypeScript à la place
        },
    },
];
