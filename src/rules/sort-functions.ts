import { TSESLint, TSESTree } from '@typescript-eslint/utils';

interface FunctionInfo {
    dependencies: Set<string>;
    functionName: string;
    index: number; // Original position in the code
    node: TSESTree.Node;
}

const sortFunctionsRule: TSESLint.RuleModule<'incorrectOrder', [{ enableFixer?: boolean }]> = {
    create(context) {
        const functionInfos: FunctionInfo[] = [];
        const exportedFunctionNames = new Set<string>();

        const options = context.options[0] || {};
        const enableFixer = options.enableFixer === true;

        const collectDependencies = (node: TSESTree.Node): Set<string> => {
            const dependencies = new Set<string>();
            const visitedNodes = new Set<TSESTree.Node>();

            function visit(node: TSESTree.Node) {
                if (!node || visitedNodes.has(node)) return;
                visitedNodes.add(node);

                if (node.type === 'Identifier' && exportedFunctionNames.has(node.name)) {
                    dependencies.add(node.name);
                }

                Object.keys(node).forEach((key) => {
                    if (key === 'type' || key === 'loc' || key === 'range' || key === 'parent') return;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const childOrChildren = (node as any)[key];

                    if (Array.isArray(childOrChildren)) {
                        childOrChildren.forEach((child) => {
                            if (child && typeof child.type === 'string') {
                                visit(child as TSESTree.Node);
                            }
                        });
                    } else if (childOrChildren && typeof childOrChildren.type === 'string') {
                        visit(childOrChildren as TSESTree.Node);
                    }
                });
            }

            visit(node);
            return dependencies;
        };

        return {
            ExportNamedDeclaration(node) {
                if (node.declaration) {
                    let functionName: null | string = null;

                    if (node.declaration.type === 'FunctionDeclaration') {
                        const funcDecl = node.declaration as TSESTree.FunctionDeclaration;
                        if (funcDecl.id && funcDecl.id.type === 'Identifier') {
                            functionName = funcDecl.id.name;
                        }
                    } else if (node.declaration.type === 'VariableDeclaration') {
                        const varDecl = node.declaration as TSESTree.VariableDeclaration;
                        const declarator = varDecl.declarations[0];
                        if (declarator && declarator.id.type === 'Identifier') {
                            const init = declarator.init;
                            if (
                                init &&
                                (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')
                            ) {
                                functionName = declarator.id.name;
                            }
                        }
                    }

                    if (functionName) {
                        exportedFunctionNames.add(functionName);
                    }
                }
            },
            'Program:exit'() {
                const sourceCode = context.getSourceCode();

                // Collect functionInfos with their dependencies and original index
                sourceCode.ast.body.forEach((node: TSESTree.Statement, index: number) => {
                    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                        let functionName: null | string = null;
                        let funcNode: null | TSESTree.Node = null;

                        if (node.declaration.type === 'FunctionDeclaration') {
                            const funcDecl = node.declaration as TSESTree.FunctionDeclaration;
                            if (funcDecl.id && funcDecl.id.type === 'Identifier') {
                                functionName = funcDecl.id.name;
                                funcNode = node;
                            }
                        } else if (node.declaration.type === 'VariableDeclaration') {
                            const varDecl = node.declaration as TSESTree.VariableDeclaration;
                            const declarator = varDecl.declarations[0];
                            if (declarator && declarator.id.type === 'Identifier') {
                                const init = declarator.init;
                                if (
                                    init &&
                                    (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')
                                ) {
                                    functionName = declarator.id.name;
                                    funcNode = node;
                                }
                            }
                        }

                        if (functionName && funcNode) {
                            const dependencies = collectDependencies(funcNode);
                            functionInfos.push({ dependencies, functionName, index, node: funcNode });
                        }
                    }
                });

                // Build a map for quick access
                const functionInfoMap = new Map<string, FunctionInfo>();
                functionInfos.forEach((funcInfo) => {
                    functionInfoMap.set(funcInfo.functionName, funcInfo);
                });

                // Perform topological sort
                const sortedFunctions: FunctionInfo[] = [];
                const visited = new Set<string>();
                const tempVisited = new Set<string>();

                function visit(funcName: string) {
                    if (visited.has(funcName)) return;
                    if (tempVisited.has(funcName)) {
                        return; // Circular dependency detected
                    }
                    tempVisited.add(funcName);

                    const funcInfo = functionInfoMap.get(funcName);
                    if (funcInfo) {
                        // Visit dependencies first
                        const sortedDependencies = Array.from(funcInfo.dependencies).sort();
                        for (const depName of sortedDependencies) {
                            visit(depName);
                        }
                        visited.add(funcName);
                        tempVisited.delete(funcName);
                        sortedFunctions.push(funcInfo);
                    }
                }

                // Start visiting functions in alphabetical order
                const functionNames = Array.from(functionInfoMap.keys()).sort();
                for (const funcName of functionNames) {
                    visit(funcName);
                }

                // Now compare the sorted functions with the original order
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
                                      const sourceCode = context.getSourceCode();

                                      // Collect the functions along with their full text including comments and whitespace
                                      const functionsWithText = functionInfos.map((info, index) => {
                                          // Determine the start index
                                          let start = info.node.range[0];

                                          // Include leading comments and whitespace
                                          const leadingComments = sourceCode.getCommentsBefore(info.node);
                                          if (leadingComments.length > 0) {
                                              start = leadingComments[0].range[0];
                                          } else {
                                              const tokenBefore = sourceCode.getTokenBefore(info.node, {
                                                  includeComments: true,
                                              });
                                              if (tokenBefore) {
                                                  start = tokenBefore.range[1];
                                              } else {
                                                  start = 0;
                                              }
                                          }

                                          // Determine the end index
                                          let end: number;

                                          // If there is a next function
                                          if (index + 1 < functionInfos.length) {
                                              const nextInfo = functionInfos[index + 1];

                                              // Include any whitespace and comments between functions
                                              end = nextInfo.node.range[0];
                                          } else {
                                              // Last function: include everything up to the end of the file
                                              end = sourceCode.text.length;
                                          }

                                          const functionText = sourceCode.text.slice(start, end);

                                          return {
                                              functionName: info.functionName,
                                              range: [start, end] as [number, number],
                                              text: functionText,
                                          };
                                      });

                                      // Build a map of functionName to functionText and range
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

                                      // Now, collect the sorted functions' texts
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
    meta: {
        docs: {
            description: 'Sort exported function declarations alphabetically while respecting dependencies',
            recommended: false,
        },
        fixable: 'code',
        messages: {
            incorrectOrder: 'Function "{{ name }}" is declared in the wrong order.',
        },
        schema: [
            {
                additionalProperties: false,
                properties: {
                    enableFixer: {
                        default: false,
                        type: 'boolean',
                    },
                },
                type: 'object',
            },
        ],
        type: 'suggestion',
    },
};

export default sortFunctionsRule;
