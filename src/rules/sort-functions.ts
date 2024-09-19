import { TSESLint, TSESTree } from '@typescript-eslint/utils';

interface FunctionInfo {
    dependencies: Set<string>;
    functionName: string;
    index: number; // Original position in the code
    node: TSESTree.Node;
}

const sortFunctionsRule: TSESLint.RuleModule<'incorrectOrder', []> = {
    create(context) {
        const functionInfos: FunctionInfo[] = [];
        const exportedFunctionNames = new Set<string>();

        function collectDependencies(node: TSESTree.Node): Set<string> {
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
        }

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
                            functionName = declarator.id.name;
                        }
                    }

                    if (functionName) {
                        exportedFunctionNames.add(functionName);
                    }
                }
            },
            'Program:exit'() {
                // @ts-expect-error Deprecated
                const sourceCode = context.sourceCode;

                // Collect functionInfos with their dependencies and original index
                sourceCode.ast.body.forEach((node: TSESTree.Statement, index: number) => {
                    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
                        let functionName: null | string = null;
                        let funcNode: null | TSESTree.Node = null;

                        if (node.declaration.type === 'FunctionDeclaration') {
                            const funcDecl = node.declaration as TSESTree.FunctionDeclaration;
                            if (funcDecl.id && funcDecl.id.type === 'Identifier') {
                                functionName = funcDecl.id.name;
                                funcNode = funcDecl;
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
                                    funcNode = declarator;
                                }
                            }
                        }

                        if (functionName && funcNode) {
                            const dependencies = collectDependencies(funcNode);
                            functionInfos.push({ dependencies, functionName, index, node });
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
                            messageId: 'incorrectOrder',
                            node: actualFunc.node,
                            // Since auto-fixing might not be safe due to dependencies, we don't provide a fixer
                        });
                    }
                }
            },
        };
    },

    defaultOptions: [],
    meta: {
        docs: {
            description: 'Sort exported function declarations alphabetically while respecting dependencies',
            recommended: false,
        },
        messages: {
            incorrectOrder: 'Function "{{ name }}" is declared in the wrong order.',
        },
        schema: [], // No options for this rule
        type: 'suggestion',
    },
};

export default sortFunctionsRule;
