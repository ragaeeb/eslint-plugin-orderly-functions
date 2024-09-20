import { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { FunctionInfo } from '../types.js';

export const collectDependencies = (node: TSESTree.Node, exportedFunctionNames: Set<string>): Set<string> => {
    const dependencies = new Set<string>();
    const visitedNodes = new Set<TSESTree.Node>();

    const visit = (node: TSESTree.Node): void => {
        if (!node || visitedNodes.has(node)) {
            return;
        }

        visitedNodes.add(node);

        if (node.type === 'Identifier' && exportedFunctionNames.has(node.name)) {
            dependencies.add(node.name);
        }

        for (const key of Object.keys(node)) {
            if (key === 'type' || key === 'loc' || key === 'range' || key === 'parent') {
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const children: TSESTree.Node[] = Array.isArray((node as any)[key]) ? (node as any)[key] : [node];

            children.filter((c: TSESTree.Node) => typeof c.type === 'string').forEach(visit);
        }
    };

    visit(node);
    return dependencies;
};

export const getExportedFunctionName = (node: TSESTree.ExportNamedDeclaration): null | string => {
    if (node.declaration) {
        if (node.declaration.type === 'FunctionDeclaration') {
            const funcDecl = node.declaration;
            if (funcDecl.id && funcDecl.id.type === 'Identifier') {
                return funcDecl.id.name;
            }
        } else if (node.declaration.type === 'VariableDeclaration') {
            const varDecl = node.declaration;
            const declarator = varDecl.declarations[0];
            if (declarator && declarator.id.type === 'Identifier') {
                const init = declarator.init;
                if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
                    return declarator.id.name;
                }
            }
        }
    }
    return null;
};

export const mapSourceCodeToFunctionInfos = (
    sourceCode: TSESLint.SourceCode,
    exportedFunctionNames: Set<string>,
): FunctionInfo[] => {
    const result: FunctionInfo[] = [];

    sourceCode.ast.body.forEach((node, index) => {
        if (node.type === 'ExportNamedDeclaration') {
            const functionName = getExportedFunctionName(node);

            if (functionName) {
                const funcNode = node;
                const dependencies = collectDependencies(funcNode, exportedFunctionNames);
                result.push({ dependencies, functionName, index, node: funcNode });
            }
        }
    });

    return result;
};
