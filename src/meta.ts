import { TSESLint } from '@typescript-eslint/utils';

const meta: TSESLint.RuleMetaData<'incorrectOrder'> = {
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
};

export default meta;
