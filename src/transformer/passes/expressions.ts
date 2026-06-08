import * as ts from "typescript";
import type { TransformContext } from "../index";
import { resolveType } from "../../analyzer/type-resolver";
import type { IRNode, IRType } from "../../types";

export function transformExpression(
  node: ts.Expression,
  ctx: TransformContext,
  typeHint?: IRType,
): IRNode {
  // Numeric literal
  if (ts.isNumericLiteral(node)) {
    return {
      kind: "literal",
      value: parseFloat(node.text),
      type: { kind: "primitive", name: "f64" },
    };
  }

  // String literal
  if (ts.isStringLiteral(node)) {
    return {
      kind: "literal",
      value: node.text,
      type: { kind: "string" },
    };
  }

  // No substitution template literal
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return {
      kind: "literal",
      value: node.text,
      type: { kind: "string" },
    };
  }

  // Boolean literals
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return {
      kind: "literal",
      value: true,
      type: { kind: "primitive", name: "bool" },
    };
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return {
      kind: "literal",
      value: false,
      type: { kind: "primitive", name: "bool" },
    };
  }

  // Null
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return {
      kind: "literal",
      value: null,
      type: { kind: "optional", inner: { kind: "primitive", name: "void" } },
    };
  }

  // Undefined
  if (
    node.kind === ts.SyntaxKind.UndefinedKeyword ||
    (ts.isIdentifier(node) && node.text === "undefined")
  ) {
    return {
      kind: "literal",
      value: null,
      type: { kind: "optional", inner: { kind: "primitive", name: "void" } },
    };
  }

  if (node.kind === ts.SyntaxKind.ThisKeyword) {
    return { kind: "identifier", name: "self", type: { kind: "unknown" } };
  }

  // Identifier
  if (ts.isIdentifier(node)) {
    const type = resolveType(ctx.checker.getTypeAtLocation(node), ctx.checker);
    return { kind: "identifier", name: node.text, type };
  }

  // Template literal
  if (ts.isTemplateExpression(node)) {
    const parts: (string | IRNode)[] = [];
    parts.push(node.head.text);
    for (const span of node.templateSpans) {
      parts.push(transformExpression(span.expression, ctx));
      parts.push(span.literal.text);
    }
    return { kind: "templateLiteral", parts };
  }

  // Binary expression
  if (ts.isBinaryExpression(node)) {
    // Assignment
    if (isAssignmentOperator(node.operatorToken.kind)) {
      return {
        kind: "assignment",
        target: transformExpression(node.left, ctx),
        value: transformExpression(node.right, ctx),
        operator: node.operatorToken.getText(ctx.sourceFile),
      };
    }

    if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
      return {
        kind: "nullishCoalesce",
        left: transformExpression(node.left, ctx),
        right: transformExpression(node.right, ctx),
      };
    }

    const resultType = resolveType(
      ctx.checker.getTypeAtLocation(node),
      ctx.checker,
    );

    return {
      kind: "binary",
      operator: mapBinaryOperator(node.operatorToken.kind),
      left: transformExpression(node.left, ctx),
      right: transformExpression(node.right, ctx),
      resultType,
    };
  }

  // Unary prefix
  if (ts.isPrefixUnaryExpression(node)) {
    return {
      kind: "unary",
      operator: mapPrefixUnaryOperator(node.operator),
      operand: transformExpression(node.operand, ctx),
      prefix: true,
    };
  }

  // Postfix (i++, i--)
  if (ts.isPostfixUnaryExpression(node)) {
    return {
      kind: "assignment",
      target: transformExpression(node.operand, ctx),
      value: {
        kind: "binary",
        operator: node.operator === ts.SyntaxKind.PlusPlusToken ? "+" : "-",
        left: transformExpression(node.operand, ctx),
        right: {
          kind: "literal",
          value: 1,
          type: { kind: "primitive", name: "f64" },
        },
        resultType: { kind: "primitive", name: "f64" },
      },
      operator: "=",
    };
  }

  // Call expression
  if (ts.isCallExpression(node)) {
    // Special case: console.log
    if (isConsoleLog(node)) {
      const args = node.arguments.map((a) => transformExpression(a, ctx));
      return { kind: "consoleLog", args };
    }

    const callee = transformExpression(node.expression, ctx);

    const sig = ctx.checker.getResolvedSignature(node);
    const args = node.arguments.map((a, i) => {
      let argTypeHint: IRType | undefined;
      if (sig) {
        const param = sig.parameters[i];
        if (param) {
          const paramType = ctx.checker.getTypeOfSymbol(param);
          argTypeHint = resolveType(paramType, ctx.checker);
        }
      }
      return transformExpression(a, ctx, argTypeHint);
    });

    if (sig) {
      const totalParams = sig.parameters.length;
      const suppliedArgs = node.arguments.length;

      for (let i = suppliedArgs; i < totalParams; i++) {
        const param = sig.parameters[i];
        const paramDecl = param.valueDeclaration;
        const isOptional =
          paramDecl &&
          ts.isParameter(paramDecl) &&
          (!!paramDecl.questionToken || !!paramDecl.initializer);

        if (isOptional) {
          args.push({
            kind: "literal",
            value: null,
            type: {
              kind: "optional",
              inner: { kind: "primitive", name: "void" },
            },
          });
        }
      }
    }

    const resultType = resolveType(
      ctx.checker.getTypeAtLocation(node),
      ctx.checker,
    );

    const calleeAnalysis = analyzeCallee(node, ctx);

    return {
      kind: "call",
      callee,
      args,
      resultType,
      calleeNeedsAllocator: calleeAnalysis.needsAllocator,
      calleeReturnsError: calleeAnalysis.returnsError,
    };
  }

  if (ts.isPropertyAccessExpression(node)) {
    const objectType = resolveType(
      ctx.checker.getTypeAtLocation(node.expression),
      ctx.checker,
    );

    if (node.name.text === "length" && objectType.kind === "array") {
      return {
        kind: "member",
        object: {
          kind: "member",
          object: transformExpression(node.expression, ctx),
          property: "items",
          objectType,
          type: objectType,
        },
        property: "len",
        objectType: { kind: "unknown" },
        type: { kind: "primitive", name: "usize" },
      };
    }

    if (node.name.text === "push" && objectType.kind === "array") {
      return {
        kind: "member",
        object: transformExpression(node.expression, ctx),
        property: "append",
        objectType,
      };
    }

    const resultType = resolveType(
      ctx.checker.getTypeAtLocation(node),
      ctx.checker,
    );

    return {
      kind: "member",
      object: transformExpression(node.expression, ctx),
      property: node.name.text,
      objectType,
      type: resultType,
    };
  }

  if (ts.isElementAccessExpression(node)) {
    return {
      kind: "index",
      object: transformExpression(node.expression, ctx),
      index: transformExpression(node.argumentExpression, ctx),
    };
  }

  if (ts.isArrayLiteralExpression(node)) {
    const elements = node.elements.map((e) => transformExpression(e, ctx));
    let elementType: IRType = { kind: "unknown" };

    const tsType = ctx.checker.getTypeAtLocation(node);
    if (ctx.checker.isArrayType(tsType)) {
      const typeArgs = (tsType as ts.TypeReference).typeArguments;
      if (typeArgs && typeArgs.length > 0) {
        elementType = resolveType(typeArgs[0], ctx.checker);
      }
    }

    return { kind: "arrayLiteral", elements, elementType };
  }

  // Object literal
  if (ts.isObjectLiteralExpression(node)) {
    const properties: { name: string; value: IRNode }[] = [];

    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop) && prop.name) {
        properties.push({
          name: prop.name.getText(ctx.sourceFile),
          value: transformExpression(prop.initializer, ctx),
        });
      }
      if (ts.isShorthandPropertyAssignment(prop)) {
        properties.push({
          name: prop.name.text,
          value: {
            kind: "identifier",
            name: prop.name.text,
            type: { kind: "unknown" },
          },
        });
      }
    }

    const typeName = resolveObjectLiteralTypeName(node, ctx, typeHint);

    return {
      kind: "objectLiteral",
      properties,
      typeName,
    };
  }

  // Parenthesized
  if (ts.isParenthesizedExpression(node)) {
    return transformExpression(node.expression, ctx, typeHint);
  }

  // Non-null assertion (x!)
  if (ts.isNonNullExpression(node)) {
    return transformExpression(node.expression, ctx, typeHint);
  }

  // As expression (type assertion)
  if (ts.isAsExpression(node)) {
    return transformExpression(node.expression, ctx, typeHint);
  }

  // Conditional (ternary) a ? b : c
  if (ts.isConditionalExpression(node)) {
    return {
      kind: "if",
      condition: transformExpression(node.condition, ctx),
      thenBody: [
        { kind: "return", value: transformExpression(node.whenTrue, ctx) },
      ],
      elseBody: [
        { kind: "return", value: transformExpression(node.whenFalse, ctx) },
      ],
    };
  }

  // New expression → init()
  if (ts.isNewExpression(node)) {
    const callee = transformExpression(node.expression, ctx);
    const args = (node.arguments ?? []).map((a) => transformExpression(a, ctx));
    const resultType = resolveType(
      ctx.checker.getTypeAtLocation(node),
      ctx.checker,
    );

    return {
      kind: "call",
      callee: {
        kind: "member",
        object: callee,
        property: "init",
        objectType: resultType,
      },
      args,
      resultType,
    };
  }

  // Typeof
  if (ts.isTypeOfExpression(node)) {
    ctx.diagnostics.push({
      severity: "warning",
      message: `typeof is not supported in Zig, using string placeholder.`,
    });
    return { kind: "literal", value: "unknown", type: { kind: "string" } };
  }

  if (ts.isAwaitExpression(node)) {
    return transformExpression(node.expression, ctx, typeHint);
  }

  // Fallback
  ctx.diagnostics.push({
    severity: "warning",
    message: `Unsupported expression kind: ${ts.SyntaxKind[node.kind]}`,
    file: ctx.sourceFile.fileName,
  });

  return {
    kind: "literal",
    value: 0,
    type: { kind: "primitive", name: "f64" },
  };
}

function analyzeCallee(
  node: ts.CallExpression,
  ctx: TransformContext,
): { needsAllocator: boolean; returnsError: boolean } {
  const sig = ctx.checker.getResolvedSignature(node);
  if (!sig) return { needsAllocator: false, returnsError: false };

  const decl = sig.declaration;
  if (!decl) return { needsAllocator: false, returnsError: false };

  if (
    !ts.isFunctionDeclaration(decl) &&
    !ts.isMethodDeclaration(decl) &&
    !ts.isConstructorDeclaration(decl)
  ) {
    return { needsAllocator: false, returnsError: false };
  }

  const body = decl.body;
  if (!body || !ts.isBlock(body)) {
    return { needsAllocator: false, returnsError: false };
  }

  let needsAllocator = false;
  let returnsError = false;

  function visit(n: ts.Node) {
    if (needsAllocator && returnsError) return; // short-circuit

    if (ts.isArrayLiteralExpression(n)) {
      needsAllocator = true;
    }
    if (ts.isTemplateExpression(n)) {
      needsAllocator = true;
    }
    if (
      ts.isBinaryExpression(n) &&
      n.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const leftType = ctx.checker.getTypeAtLocation(n.left);
      if (
        leftType.flags & ts.TypeFlags.String ||
        leftType.flags & ts.TypeFlags.StringLiteral
      ) {
        needsAllocator = true;
      }
    }
    if (ts.isNewExpression(n)) {
      needsAllocator = true;
    }

    if (ts.isThrowStatement(n)) {
      returnsError = true;
    }

    ts.forEachChild(n, visit);
  }

  ts.forEachChild(body, visit);

  if (needsAllocator) {
    returnsError = true;
  }

  return { needsAllocator, returnsError };
}

function resolveObjectLiteralTypeName(
  node: ts.ObjectLiteralExpression,
  ctx: TransformContext,
  typeHint?: IRType,
): string | undefined {
  const contextualType = ctx.checker.getContextualType(node);
  if (contextualType) {
    const contextSymbol =
      contextualType.getSymbol() ?? contextualType.aliasSymbol;
    if (contextSymbol) {
      const name = contextSymbol.getName();
      if (name && !isInternalTypeName(name)) {
        return name;
      }
    }
  }

  if (
    typeHint &&
    typeHint.kind === "struct" &&
    !isInternalTypeName(typeHint.name)
  ) {
    return typeHint.name;
  }

  const tsType = ctx.checker.getTypeAtLocation(node);
  const symbol = tsType.getSymbol();
  if (symbol) {
    const name = symbol.getName();
    if (name && !isInternalTypeName(name)) {
      return name;
    }
  }

  const aliasSymbol = tsType.aliasSymbol;
  if (aliasSymbol) {
    const name = aliasSymbol.getName();
    if (name && !isInternalTypeName(name)) {
      return name;
    }
  }

  return undefined;
}

function isInternalTypeName(name: string): boolean {
  return name.startsWith("__");
}

function isConsoleLog(node: ts.CallExpression): boolean {
  if (!ts.isPropertyAccessExpression(node.expression)) return false;
  const obj = node.expression;
  return (
    ts.isIdentifier(obj.expression) &&
    obj.expression.text === "console" &&
    (obj.name.text === "log" ||
      obj.name.text === "error" ||
      obj.name.text === "warn")
  );
}

function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsToken ||
    kind === ts.SyntaxKind.PlusEqualsToken ||
    kind === ts.SyntaxKind.MinusEqualsToken ||
    kind === ts.SyntaxKind.AsteriskEqualsToken ||
    kind === ts.SyntaxKind.SlashEqualsToken
  );
}

function mapBinaryOperator(kind: ts.SyntaxKind): string {
  switch (kind) {
    case ts.SyntaxKind.PlusToken:
      return "+";
    case ts.SyntaxKind.MinusToken:
      return "-";
    case ts.SyntaxKind.AsteriskToken:
      return "*";
    case ts.SyntaxKind.SlashToken:
      return "/";
    case ts.SyntaxKind.PercentToken:
      return "%";
    case ts.SyntaxKind.EqualsEqualsToken:
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
      return "==";
    case ts.SyntaxKind.ExclamationEqualsToken:
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      return "!=";
    case ts.SyntaxKind.LessThanToken:
      return "<";
    case ts.SyntaxKind.LessThanEqualsToken:
      return "<=";
    case ts.SyntaxKind.GreaterThanToken:
      return ">";
    case ts.SyntaxKind.GreaterThanEqualsToken:
      return ">=";
    case ts.SyntaxKind.AmpersandAmpersandToken:
      return "and";
    case ts.SyntaxKind.BarBarToken:
      return "or";
    default:
      return "+";
  }
}

function mapPrefixUnaryOperator(op: ts.PrefixUnaryOperator): string {
  switch (op) {
    case ts.SyntaxKind.MinusToken:
      return "-";
    case ts.SyntaxKind.PlusToken:
      return "+";
    case ts.SyntaxKind.ExclamationToken:
      return "!";
    case ts.SyntaxKind.TildeToken:
      return "~";
    default:
      return "!";
  }
}
