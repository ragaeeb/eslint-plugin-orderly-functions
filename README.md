[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/7b2ac0a5-5d00-4df0-bda7-efe5a7bea8f9.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/7b2ac0a5-5d00-4df0-bda7-efe5a7bea8f9) ![GitHub](https://img.shields.io/github/license/ragaeeb/eslint-plugin-orderly-functions) ![npm](https://img.shields.io/npm/v/eslint-plugin-orderly-functions) ![npm](https://img.shields.io/npm/dm/eslint-plugin-orderly-functions) ![GitHub issues](https://img.shields.io/github/issues/ragaeeb/eslint-plugin-orderly-functions) ![GitHub stars](https://img.shields.io/github/stars/ragaeeb/eslint-plugin-orderly-functions?style=social) ![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/eslint-plugin-orderly-functions) [![codecov](https://codecov.io/gh/ragaeeb/eslint-plugin-orderly-functions/graph/badge.svg?token=89OEN3NDHD)](https://codecov.io/gh/ragaeeb/eslint-plugin-orderly-functions) [![Size](https://deno.bundlejs.com/badge?q=eslint-plugin-orderly-functions@1.0.0&badge=detailed)](https://bundlejs.com/?q=eslint-plugin-orderly-functions%401.0.0) ![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)

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

Add orderly-functions to the plugins section of your ESLint configuration file (e.g., .eslintrc.js):

## Rule Details

This plugin provides the following rule:

sort-functions
This rule enforces that exported function declarations are sorted alphabetically while respecting their dependencies. If a function depends on another, it should be declared after its dependencies, even if it would come earlier alphabetically.

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
