import { parse } from '@typescript-eslint/parser';
import { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { describe, expect, it } from 'vitest';

import { FunctionInfo } from '../../src/types';
import { getFunctionsWithText } from './fixer';

describe('walker', () => {
    describe('getFunctionsWithText', () => {
        it('retrieves functions with text and ranges', () => {
            const code = `
      export const a = () => {
        return 'a';
      };

      /* Comment */
      export const b = () => {
        return 'b';
      };
    `;
            const ast = parse(code, { comment: true, sourceType: 'module' }) as TSESLint.AST<TSESTree.Options>;
            const sourceCode = new TSESLint.SourceCode(code, ast);

            const functionInfos: FunctionInfo[] = [];
            ast.body.forEach((node, index) => {
                if (node.type === 'ExportNamedDeclaration') {
                    const functionName =
                        node.declaration && node.declaration.type === 'VariableDeclaration'
                            ? (node.declaration.declarations[0].id as TSESTree.Identifier).name
                            : null;
                    if (functionName) {
                        functionInfos.push({
                            dependencies: new Set(),
                            functionName,
                            index,
                            node,
                        });
                    }
                }
            });

            const functionsWithText = getFunctionsWithText(functionInfos, sourceCode);
            expect(functionsWithText.length).toBe(2);
            expect(functionsWithText[0].functionName).toBe('a');
            expect(functionsWithText[1].functionName).toBe('b');

            expect(functionsWithText[0].text).toContain('export const a = () => {');
            expect(functionsWithText[1].text).toContain('/* Comment */');
            expect(functionsWithText[1].text).toContain('export const b = () => {');
        });
    });
});
