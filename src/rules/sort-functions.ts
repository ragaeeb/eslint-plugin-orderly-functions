import { TSESLint } from '@typescript-eslint/utils';

import meta from '../meta.js';
import { FunctionInfo } from '../types.js';
import { getFunctionsWithText } from '../utils/fixer.js';
import { topologicalSortFunctions } from '../utils/sorting.js';
import { collectDependencies, getExportedFunctionName } from '../utils/walking.js';

const sortFunctionsRule: TSESLint.RuleModule<'incorrectOrder', [{ enableFixer?: boolean }]> = {
    create(context) {
        const functionInfos: FunctionInfo[] = [];
        const exportedFunctionNames = new Set<string>();

        const options = context.options[0] || {};
        const enableFixer = options.enableFixer === true;

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
                sourceCode.ast.body.forEach((node, index) => {
                    if (node.type === 'ExportNamedDeclaration') {
                        const functionName = getExportedFunctionName(node);
                        if (functionName) {
                            const funcNode = node;
                            const dependencies = collectDependencies(funcNode, exportedFunctionNames);
                            functionInfos.push({ dependencies, functionName, index, node: funcNode });
                        }
                    }
                });

                // Perform topological sort
                const sortedFunctions = topologicalSortFunctions(functionInfos);

                // Compare the sorted functions with the original order
                for (let i = 0; i < sortedFunctions.length; i++) {
                    const expectedFunc = sortedFunctions[i];
                    const actualFunc = functionInfos[i];
                    if (expectedFunc.functionName !== actualFunc.functionName) {
                        context.report({
                            data: {
                                name: actualFunc.functionName,
                            },
                            fix: enableFixer
                                ? (fixer) => {
                                      const functionsWithText = getFunctionsWithText(functionInfos, sourceCode);

                                      // Map function names to their texts
                                      const functionTextsMap = new Map<
                                          string,
                                          { range: [number, number]; text: string }
                                      >();
                                      for (const func of functionsWithText) {
                                          functionTextsMap.set(func.functionName, {
                                              range: func.range,
                                              text: func.text,
                                          });
                                      }

                                      // Collect the sorted functions' texts
                                      const sortedFunctionTexts = sortedFunctions.map(
                                          (info) => functionTextsMap.get(info.functionName)!,
                                      );

                                      // Determine the range to replace
                                      const replaceRange: [number, number] = [
                                          functionsWithText[0].range[0],
                                          functionsWithText[functionsWithText.length - 1].range[1],
                                      ];

                                      // Build the new code
                                      const newCode = sortedFunctionTexts.map((func) => func.text).join('');

                                      return fixer.replaceTextRange(replaceRange, newCode);
                                  }
                                : null,
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
