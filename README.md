[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/7b2ac0a5-5d00-4df0-bda7-efe5a7bea8f9.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/7b2ac0a5-5d00-4df0-bda7-efe5a7bea8f9) ![GitHub](https://img.shields.io/github/license/ragaeeb/eslint-plugin-orderly-functions) ![npm](https://img.shields.io/npm/v/eslint-plugin-orderly-functions) ![npm](https://img.shields.io/npm/dm/eslint-plugin-orderly-functions) ![GitHub issues](https://img.shields.io/github/issues/ragaeeb/eslint-plugin-orderly-functions) ![GitHub stars](https://img.shields.io/github/stars/ragaeeb/eslint-plugin-orderly-functions?style=social) ![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/eslint-plugin-orderly-functions) [![codecov](https://codecov.io/gh/ragaeeb/eslint-plugin-orderly-functions/graph/badge.svg?token=89OEN3NDHD)](https://codecov.io/gh/ragaeeb/eslint-plugin-orderly-functions) [![Size](https://deno.bundlejs.com/badge?q=eslint-plugin-orderly-functions@1.1.0&badge=detailed)](https://bundlejs.com/?q=eslint-plugin-orderly-functions%401.1.0) ![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)

An ESLint plugin to sort exported function declarations alphabetically while respecting their dependencies.

## **Installation**

You'll first need to install [ESLint](https://eslint.org/):

```bash
npm install eslint --save-dev
# or
yarn add -D eslint
# or
pnpm i -D eslint

```

```bash
npm install -D eslint-plugin-orderly-functions
# or
yarn add -D eslint-plugin-orderly-functions
# or
pnpm i -D eslint-plugin-orderly-functions
```

## Usage

In your ESLint configuration file (`.eslintrc.js` or `eslint.config.js` for ESLint v9+), add the plugin and configure the rule.

```javascript
// eslint.config.js for ESLint v9+ (flat config)
import orderlyFunctions from 'eslint-plugin-orderly-functions';

export default [
    {
        plugins: {
            'orderly-functions': orderlyFunctions,
        },
        rules: {
            'orderly-functions/sort-functions': 'error',
        },
    },
];
```

### Enabling the Autofixer:

```javascript
// eslint.config.js
import orderlyFunctions from 'eslint-plugin-orderly-functions';

export default [
    {
        plugins: {
            'orderly-functions': orderlyFunctions,
        },
        rules: {
            'orderly-functions/sort-functions': [
                'error',
                {
                    enableFixer: true,
                },
            ],
        },
    },
];
```

Note: Enabling the autofixer will reorder your exported functions according to the rule. Use it with caution and ensure you have proper version control and testing in place.

## Rule Details

This rule enforces that exported functions are sorted alphabetically while respecting their dependencies.

### Options

-   `enableFixer` (boolean, default: `false`): Enables the autofixer to automatically reorder functions.

Examples of incorrect code:

```javascript
export const c = () => {
    return a() + b();
};
export const a = () => 'a';
export const b = () => 'b';
```

Examples of correct code:

```javascript
export const a = () => 'a';
export const b = () => 'b';
export const c = () => {
    return a() + b();
};
```
