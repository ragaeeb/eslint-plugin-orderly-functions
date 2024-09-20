import { parse } from '@typescript-eslint/parser';
import { TSESTree } from '@typescript-eslint/utils';
import { describe, expect, it } from 'vitest';

import { getExportedFunctionName } from './walking';

describe('walking', () => {
    describe('getExportedFunctionName', () => {
        it('gets function name from FunctionDeclaration', () => {
            const code = `
            export function a() {
              return 'a';
            }
          `;
            const ast = parse(code, { sourceType: 'module' }) as TSESTree.Program;
            const exportNode = ast.body[0] as TSESTree.ExportNamedDeclaration;
            const functionName = getExportedFunctionName(exportNode);
            expect(functionName).toBe('a');
        });

        it('gets function name from VariableDeclaration', () => {
            const code = `
            export const a = () => {
              return 'a';
            };
          `;
            const ast = parse(code, { sourceType: 'module' }) as TSESTree.Program;
            const exportNode = ast.body[0] as TSESTree.ExportNamedDeclaration;
            const functionName = getExportedFunctionName(exportNode);
            expect(functionName).toBe('a');
        });

        it('returns null if not a function', () => {
            const code = `
            export const a = 'a';
          `;
            const ast = parse(code, { sourceType: 'module' }) as TSESTree.Program;
            const exportNode = ast.body[0] as TSESTree.ExportNamedDeclaration;
            const functionName = getExportedFunctionName(exportNode);
            expect(functionName).toBeNull();
        });
    });
});
