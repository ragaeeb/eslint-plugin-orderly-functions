// src/utils/topologicalSort.ts
import { FunctionInfo } from '../types.js';

export function topologicalSortFunctions(functionInfos: FunctionInfo[]): FunctionInfo[] {
    const functionInfoMap = new Map<string, FunctionInfo>();
    for (const funcInfo of functionInfos) {
        functionInfoMap.set(funcInfo.functionName, funcInfo);
    }

    const sortedFunctions: FunctionInfo[] = [];
    const visited = new Set<string>();
    const tempVisited = new Set<string>();

    function visit(funcName: string) {
        if (visited.has(funcName)) return;
        if (tempVisited.has(funcName)) {
            // Circular dependency detected
            // We still add the function to the sorted list to allow comparison
            tempVisited.delete(funcName);
            visited.add(funcName);
            const funcInfo = functionInfoMap.get(funcName);
            if (funcInfo) {
                sortedFunctions.push(funcInfo);
            }
            return;
        }
        tempVisited.add(funcName);

        const funcInfo = functionInfoMap.get(funcName);
        if (funcInfo) {
            const sortedDependencies = Array.from(funcInfo.dependencies).sort();
            for (const depName of sortedDependencies) {
                visit(depName);
            }
            tempVisited.delete(funcName);
            visited.add(funcName);
            sortedFunctions.push(funcInfo);
        } else {
            tempVisited.delete(funcName);
        }
    }

    const functionNames = Array.from(functionInfoMap.keys()).sort();
    for (const funcName of functionNames) {
        visit(funcName);
    }

    return sortedFunctions;
}
