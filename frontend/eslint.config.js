import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
    js.configs.recommended,
    ...vuePlugin.configs['flat/recommended'],
    {
        files: ['src/**/*.{ts,vue}'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                HTMLElement: 'readonly',
                IntersectionObserver: 'readonly',
                fetch: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            vue: vuePlugin,
        },
        rules: {
            // Complexité cyclomatique max: 10
            'complexity': ['error', { max: 10 }],

            // Autres règles de qualité
            'max-depth': ['error', 4],
            'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
            'max-nested-callbacks': ['error', 3],

            // TypeScript
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-unused-vars': 'off',

            // Vue specific - Assouplir certaines règles
            'vue/multi-word-component-names': 'off',
            'vue/max-attributes-per-line': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/html-self-closing': 'off',
            'vue/attributes-order': 'off',
        },
    },
];
