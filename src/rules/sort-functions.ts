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
            const visitorKeys = context.sourceCode.visitorKeys || {};

            function visit(node: TSESTree.Node) {
                if (!node || visitedNodes.has(node)) return;
                visitedNodes.add(node);

                if (node.type === 'Identifier' && exportedFunctionNames.has(node.name)) {
                    dependencies.add(node.name);
                }

                const keys = visitorKeys[node.type] || [];
                for (const key of keys) {
                    const child = (node as any)[key];

                    if (Array.isArray(child)) {
                        for (const c of child) {
                            if (c && typeof c.type === 'string') {
                                visit(c);
                            }
                        }
                    } else if (child && typeof child.type === 'string') {
                        visit(child);
                    }
                }
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
                const { sourceCode } = context;

                // Collect functionInfos with their dependencies and original index
                sourceCode.ast.body.forEach((node, index) => {
                    if (
                        node.type === 'ExportNamedDeclaration' &&
                        node.declaration &&
                        (node.declaration.type === 'FunctionDeclaration' ||
                            (node.declaration.type === 'VariableDeclaration' &&
                                node.declaration.declarations[0]?.init &&
                                (node.declaration.declarations[0].init.type === 'ArrowFunctionExpression' ||
                                    node.declaration.declarations[0].init.type === 'FunctionExpression')))
                    ) {
                        const functionName = node.declaration.id
                            ? (node.declaration.id as TSESTree.Identifier).name
                            : (node.declaration.declarations[0]?.id as TSESTree.Identifier).name;

                        if (functionName) {
                            const dependencies = collectDependencies(node.declaration);
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
                            fix: () => null, // Auto-fixing might not be safe
                            messageId: 'incorrectOrder',
                            node: actualFunc.node,
                        });
                    }
                }
            },
        };
    },
    meta: {
        docs: {
            description: 'Sort exported function declarations alphabetically while respecting dependencies',
            recommended: false,
        },
        fixable: null, // Auto-fixing may not be safe
        messages: {
            incorrectOrder: 'Function "{{ name }}" is declared in the wrong order.',
        },
        schema: [], // No options for this rule
        type: 'suggestion',
    },
};

export default sortFunctionsRule;
