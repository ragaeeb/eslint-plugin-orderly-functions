import { TSESLint } from '@typescript-eslint/utils';

import { FunctionInfo, FunctionText } from '../types.js';

interface FunctionWithText {
    functionName: string;
    range: [number, number];
    text: string;
}

export const getFunctionsWithText = (
    functionInfos: FunctionInfo[],
    sourceCode: TSESLint.SourceCode,
): FunctionWithText[] => {
    return functionInfos.map((info, index) => {
        // Determine the start index
        let start = info.node.range[0];

        // Include leading comments and whitespace
        const leadingComments = sourceCode.getCommentsBefore(info.node);
        if (leadingComments.length > 0) {
            start = leadingComments[0].range[0];
        } else {
            const tokenBefore = sourceCode.getTokenBefore(info.node, { includeComments: true });
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
            end = nextInfo.node.range[0];
        } else {
            // Last function: include everything up to the end of the file
            end = sourceCode.text.length;
        }

        const functionText = sourceCode.text.slice(start, end);

        return {
            functionName: info.functionName,
            range: [start, end],
            text: functionText,
        };
    });
};

export const fixFunctions = (
    fixer: TSESLint.RuleFixer,
    functionInfos: FunctionInfo[],
    sourceCode: TSESLint.SourceCode,
    sortedFunctions: FunctionInfo[],
) => {
    const functionsWithText = getFunctionsWithText(functionInfos, sourceCode);

    // Map function names to their texts
    const functionTextsMap = new Map<string, FunctionText>();
    for (const func of functionsWithText) {
        functionTextsMap.set(func.functionName, {
            range: func.range,
            text: func.text,
        });
    }

    // Collect the sorted functions' texts
    const sortedFunctionTexts = sortedFunctions.map((info) => functionTextsMap.get(info.functionName)!);

    // Determine the range to replace
    const replaceRange: [number, number] = [
        functionsWithText[0].range[0],
        functionsWithText[functionsWithText.length - 1].range[1],
    ];

    // Build the new code
    const newCode = sortedFunctionTexts.map((func) => func.text).join('');

    return fixer.replaceTextRange(replaceRange, newCode);
};
