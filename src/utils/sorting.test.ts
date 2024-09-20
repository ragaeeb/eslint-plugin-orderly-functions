import { describe, expect, it } from 'vitest';

import { FunctionInfo } from '../../src/types';
import { topologicalSortFunctions } from './sorting';

describe('sorting', () => {
    describe('topologicalSortFunctions', () => {
        it('sorts functions alphabetically without dependencies', () => {
            const functionInfos: FunctionInfo[] = [
                { dependencies: new Set(), functionName: 'c', index: 0, node: {} as any },
                { dependencies: new Set(), functionName: 'a', index: 1, node: {} as any },
                { dependencies: new Set(), functionName: 'b', index: 2, node: {} as any },
            ];

            const sortedFunctions = topologicalSortFunctions(functionInfos);
            expect(sortedFunctions.map((f) => f.functionName)).toEqual(['a', 'b', 'c']);
        });

        it('sorts functions based on dependencies', () => {
            const functionInfos: FunctionInfo[] = [
                { dependencies: new Set(['a', 'b']), functionName: 'c', index: 0, node: {} as any },
                { dependencies: new Set(), functionName: 'a', index: 1, node: {} as any },
                { dependencies: new Set(['a']), functionName: 'b', index: 2, node: {} as any },
            ];

            const sortedFunctions = topologicalSortFunctions(functionInfos);
            expect(sortedFunctions.map((f) => f.functionName)).toEqual(['a', 'b', 'c']);
        });

        it('handles circular dependencies', () => {
            const functionInfos: FunctionInfo[] = [
                { dependencies: new Set(['b']), functionName: 'a', index: 0, node: {} as any },
                { dependencies: new Set(['a']), functionName: 'b', index: 1, node: {} as any },
            ];

            const sortedFunctions = topologicalSortFunctions(functionInfos);
            expect(sortedFunctions.map((f) => f.functionName)).toEqual(['a', 'b', 'a']);
        });
    });
});
