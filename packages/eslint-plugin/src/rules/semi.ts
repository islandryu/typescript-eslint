import {
  TSESTree,
  TSESLint,
  AST_NODE_TYPES,
} from '@typescript-eslint/experimental-utils';
import { getESLintCoreRule } from '../util/getESLintCoreRule';
import * as util from '../util';

const baseRule = getESLintCoreRule('semi');

export type Options = util.InferOptionsTypeFromRule<typeof baseRule>;
export type MessageIds = util.InferMessageIdsTypeFromRule<typeof baseRule>;

export default util.createRule<Options, MessageIds>({
  name: 'semi',
  meta: {
    type: 'layout',
    docs: {
      description: 'Require or disallow semicolons instead of ASI',
      // too opinionated to be recommended
      recommended: false,
      extendsBaseRule: true,
    },
    fixable: 'code',
    hasSuggestions: baseRule.meta.hasSuggestions,
    schema: baseRule.meta.schema,
    // TODO: this rule has only had messages since v7.0 - remove this when we remove support for v6
    messages: baseRule.meta.messages ?? {
      missingSemi: 'Missing semicolon.',
      extraSemi: 'Extra semicolon.',
    },
  },
  defaultOptions: [
    'always',
    {
      omitLastInOneLineBlock: false,
      beforeStatementContinuationChars: 'any',
    },
  ],
  create(context) {
    const rules = baseRule.create(context);
    const checkForSemicolon =
      rules.ExpressionStatement as TSESLint.RuleFunction<TSESTree.Node>;

    /*
      The following nodes are handled by the member-delimiter-style rule
      AST_NODE_TYPES.TSCallSignatureDeclaration,
      AST_NODE_TYPES.TSConstructSignatureDeclaration,
      AST_NODE_TYPES.TSIndexSignature,
      AST_NODE_TYPES.TSMethodSignature,
      AST_NODE_TYPES.TSPropertySignature,
    */
    const nodesToCheck = [
      AST_NODE_TYPES.PropertyDefinition,
      AST_NODE_TYPES.TSAbstractPropertyDefinition,
      AST_NODE_TYPES.TSDeclareFunction,
      AST_NODE_TYPES.TSExportAssignment,
      AST_NODE_TYPES.TSImportEqualsDeclaration,
      AST_NODE_TYPES.TSTypeAliasDeclaration,
      AST_NODE_TYPES.TSEmptyBodyFunctionExpression,
    ].reduce<TSESLint.RuleListener>((acc, node) => {
      acc[node as string] = checkForSemicolon;
      return acc;
    }, {});

    return {
      ...rules,
      ...nodesToCheck,
      ExportDefaultDeclaration(node): void {
        if (node.declaration.type !== AST_NODE_TYPES.TSInterfaceDeclaration) {
          rules.ExportDefaultDeclaration(node);
        }
      },
    };
  },
});
