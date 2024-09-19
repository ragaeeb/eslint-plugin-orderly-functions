import tsParser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';

import rule from './sort-functions';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 'latest',
        parser: tsParser,
        sourceType: 'module',
    },
});

ruleTester.run('sort-functions', rule, {
    invalid: [
        {
            code: `
          export const c = (): string => {
            return a() + b();
          };
          export const a = (): string => {
            return 'a';
          };
          export const b = (): string => {
            return 'b';
          };
        `,
            errors: [
                { message: 'Function "c" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Multiple dependencies with fixer',
            options: [{ enableFixer: true }],
            output: `
          export const a = (): string => {
            return 'a';
          };
          
          export const b = (): string => {
            return 'b';
          };
        
          export const c = (): string => {
            return a() + b();
          };
          `,
        },

        {
            code: `
            export const b = (): string => 'b';
            export const a = (): string => 'a';
          `,
            errors: [
                { message: 'Function "b" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
            ],
            name: 'Functions out of alphabetical order with fixer',
            options: [{ enableFixer: true }],
            output: `
            export const a = (): string => 'a';
          
            export const b = (): string => 'b';
            `,
        },
        {
            code: `
            export function c() {
              return 'c';
            }
            export const a = function () {
              return 'a';
            };
            export const b = (): string => 'b';
          `,
            errors: [
                { message: 'Function "c" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Function expressions should be sorted alphabetically with fixer',
            options: [{ enableFixer: true }],
            output: `
            export const a = function () {
              return 'a';
            };
            
            export const b = (): string => 'b';
          
            export function c() {
              return 'c';
            }
            `,
        },
        {
            code: `
            export const b = (): string => 'b';
    
            /* This is a comment */
            export const a = (): string => 'a';
          `,
            errors: [
                { message: 'Function "b" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
            ],
            name: 'Comments should not affect function sorting with fixer',
            options: [{ enableFixer: true }],
            output: `/* This is a comment */
            export const a = (): string => 'a';
          
            export const b = (): string => 'b';
    
            /* This is a comment */
            `,
        },
        {
            code: `
          export const c = (): string => {
            return a() + b();
          };
          export const a = (): string => {
            return 'a';
          };
          export const b = (): string => {
            return 'b';
          };
        `,
            errors: [
                { message: 'Function "c" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Multiple dependencies',
        },
        {
            code: `
          export const z = (): string => {
            return 'z';
          };
          export const a = (): string => {
            return 'a';
          };
          export const b = (): string => {
            return 'b';
          };
        `,
            errors: [
                { message: 'Function "z" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Alphabetical order incorrect with no dependencies',
        },
        {
            code: `
            export const b = (): string => 'b';
            export const a = (): string => 'a';
          `,
            errors: [
                { message: 'Function "b" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
            ],
            name: 'Functions out of alphabetical order',
        },
        {
            code: `
            export function c() {
              return 'c';
            }
            export const a = function () {
              return 'a';
            };
            export const b = (): string => 'b';
          `,
            errors: [
                { message: 'Function "c" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Function expressions should be sorted alphabetically',
        },
        {
            code: `
            export const b = (): string => 'b';
        
            /* This is a comment */
            export const a = (): string => 'a';
          `,
            errors: [
                { message: 'Function "b" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
            ],
            name: 'Comments should not affect function sorting',
        },
        {
            code: `
            export async function b() {
              return 'b';
            }
            export function* a() {
              yield 'a';
            }
          `,
            errors: [
                { message: 'Function "b" is declared in the wrong order.' },
                { message: 'Function "a" is declared in the wrong order.' },
            ],
            name: 'Async and generator functions should be sorted alphabetically',
        },
        {
            code: `
            export { a } from './moduleA';
            export function c() {
              return 'c';
            }
            export const b = (): string => 'b';
          `,
            errors: [
                { message: 'Function "c" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Only local exported functions should be sorted',
        },
        {
            code: `
            export function a() {
              return b();
            }
            export function b() {
              return a();
            }
          `,
            errors: [
                { message: 'Function "a" is declared in the wrong order.' },
                { message: 'Function "b" is declared in the wrong order.' },
            ],
            name: 'Circular dependency between functions',
        },
    ],
    valid: [
        {
            code: ``,
            name: 'No functions (empty file)',
        },
        {
            code: `
        export const a = (): string => {
          return 'a';
        };
        export const b = (): string => {
          return 'b';
        };
        export const c = (): string => {
          return 'c';
        };
      `,
            name: 'Already sorted alphabetically with no dependencies',
        },
        {
            code: `
        export const a = (): string => {
          return 'a';
        };
        export const b = (): string => {
          return a();
        };
        export const c = (): string => {
          return a() + b();
        };
      `,
            name: 'Functions with dependencies already ordered correctly',
        },
        {
            code: `
        export const a = (): string => {
          return 'a';
        };
        function a() {
          return 'local a';
        }
        export const b = (): string => {
          return 'b';
        };
      `,
            name: 'Functions with the same name in different scopes (should not conflict)',
        },
        {
            code: `
      function internalFunc() {
        return 'internal';
      }
      export const a = (): string => {
        return internalFunc();
      };
      export const b = (): string => {
        return 'b';
      };
    `,
            name: 'Correct order for exported functions even with internal function dependency',
        },
        {
            code: `
            export const a = (): string => 'a';
            export const b = (): string => 'b';
          `,
            name: 'Alphabetical order with no dependencies',
        },
        {
            code: `
            import { externalFunction } from 'external-module';
            export { externalFunction };
            export const a = (): string => 'a';
            export const b = (): string => 'b';
          `,
            name: 'Re-exported functions should not affect sorting',
        },
        {
            code: `
            export const z = 'z value';
            export const a = (): string => 'a';
            export const b = (): string => 'b';
          `,
            name: 'Exported variables should be ignored by the rule',
        },
        {
            code: `
            export default function main() {
              return 'main function';
            }
            export const a = (): string => 'a';
            export const b = (): string => 'b';
          `,
            name: 'Default exports should not affect sorting',
        },
        {
            code: `
            export class ZClass {}
            export const a = (): string => 'a';
            export const b = (): string => 'b';
          `,
            name: 'Exported classes should be ignored by the rule',
        },
        {
            code: `
            export const a = (): string => {
              function nestedFunction() {
                return 'nested';
              }
              return nestedFunction();
            };
            export const b = (): string => 'b';
          `,
            name: 'Nested functions should not affect sorting',
        },
        {
            code: `
            export const a = (): string => {
              return 'a';
            };
            export const b = (): string => {
              return 'b';
            };
            export const c = (): string => {
              function innerFunction() {
                return a() + b();
              }
              return innerFunction();
            };
          `,
            name: 'Nested function dependencies',
        },
        {
            code: `
            export const a = (): string => 'a';
            export const b = (): string => 'b';
            export const c = (): string => \`\${a()} and \${b()}\`;
          `,
            name: 'Template literals with function calls',
        },
        {
            code: `
            export * from './moduleA';
            export const a = (): string => 'a';
            export const b = (): string => 'b';
          `,
            name: 'Export all statements should be ignored by the rule',
        },
        {
            code: `
            export const func = (): string => 'func';
            export const funcExtended = (): string => 'funcExtended';
          `,
            name: 'Functions with similar names correctly ordered',
        },
        {
            code: `
          export const b = (): string => 'b', a = (): string => 'a';
        `,
            name: 'Multiple exports in a single statement should be fine',
        },
        {
            code: `
            export function a() {
              return 'a';
            }
            export function b() {
              return 'b';
            }
            export function c() {
              return a() + b();
            }
          `,
            name: 'Functions with dependencies correctly ordered',
        },
    ],
});
