import { TSESTree } from '@typescript-eslint/utils';

export interface FunctionInfo {
    dependencies: Set<string>;
    functionName: string;
    index: number; // Original position in the code
    node: TSESTree.Node;
}
