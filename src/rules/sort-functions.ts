import { TSESLint } from '@typescript-eslint/utils';

import meta from '../meta.js';
import { FunctionInfo, SortFunctionRuleOptions } from '../types.js';
import { fixFunctions } from '../utils/fixer.js';
import { topologicalSortFunctions } from '../utils/sorting.js';
import { getExportedFunctionName, mapSourceCodeToFunctionInfos } from '../utils/walking.js';

const sortFunctionsRule: TSESLint.RuleModule<'incorrectOrder', [{ enableFixer?: boolean }]> = {
    create(context) {
        const functionInfos: FunctionInfo[] = [];
        const exportedFunctionNames = new Set<string>();

        const { enableFixer }: SortFunctionRuleOptions = context.options[0] || {};

        return {
            ExportNamedDeclaration(node) {
                const functionName = getExportedFunctionName(node);
                if (functionName) {
                    exportedFunctionNames.add(functionName);
                }
            },
            'Program:exit'() {
                const sourceCode = context.getSourceCode();

                // Collect functionInfos with their dependencies and original index
                functionInfos.push(...mapSourceCodeToFunctionInfos(sourceCode, exportedFunctionNames));

                // Perform topological sort
                const sortedFunctions = topologicalSortFunctions(functionInfos);

                const fix = enableFixer
                    ? (fixer: TSESLint.RuleFixer) => fixFunctions(fixer, functionInfos, sourceCode, sortedFunctions)
                    : null;

                // Compare the sorted functions with the original order
                for (let i = 0; i < sortedFunctions.length; i++) {
                    const expectedFunc = sortedFunctions[i];
                    const actualFunc = functionInfos[i];
                    if (expectedFunc.functionName !== actualFunc.functionName) {
                        context.report({
                            data: {
                                name: actualFunc.functionName,
                            },
                            fix,
                            messageId: 'incorrectOrder',
                            node: actualFunc.node,
                        });
                    }
                }
            },
        };
    },
    defaultOptions: [{ enableFixer: false }],
    meta,
};

export default sortFunctionsRule;
