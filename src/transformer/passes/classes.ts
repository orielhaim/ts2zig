import * as ts from "typescript";
import type { TransformContext } from "../index";
import {
  resolveType,
  resolveTypeFromNode,
  needsAllocator,
} from "../../analyzer/type-resolver";
import { transformExpression } from "./expressions";
import { transformStatement } from "./statements";
import type {
  IRStruct,
  IRField,
  IRFunction,
  IRParam,
  IRNode,
  IRType,
} from "../../types";

export function transformClass(
  node: ts.ClassDeclaration,
  ctx: TransformContext,
): IRStruct | null {
  const name = node.name?.text ?? "AnonymousClass";
  const fields: IRField[] = [];
  const methods: IRFunction[] = [];
  let hasExplicitConstructor = false;

  // Inheritance warning
  if (node.heritageClauses) {
    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        ctx.diagnostics.push({
          severity: "warning",
          message: `Class "${name}" uses inheritance (extends). Inheritance is not supported — only the class's own members will be compiled.`,
          file: ctx.sourceFile.fileName,
        });
      }
    }
  }

  for (const member of node.members) {
    if (ts.isPropertyDeclaration(member)) {
      const fieldName = member.name.getText(ctx.sourceFile);
      let fieldType: IRType;

      if (member.type) {
        fieldType = resolveTypeFromNode(
          member.type,
          ctx.checker,
          ctx.sourceFile,
        );
      } else {
        fieldType = resolveType(
          ctx.checker.getTypeAtLocation(member),
          ctx.checker,
        );
      }

      const isOptional = !!member.questionToken;

      let defaultValue: IRNode | undefined;
      if (member.initializer) {
        if (
          ts.isArrayLiteralExpression(member.initializer) &&
          member.initializer.elements.length === 0
        ) {
          defaultValue = { kind: "emptyArrayInit" } as any;
        } else {
          defaultValue = transformExpression(member.initializer, ctx);
        }
      }

      fields.push({
        name: fieldName,
        type: isOptional ? { kind: "optional", inner: fieldType } : fieldType,
        defaultValue,
        isPublic: true,
        isOptional,
      });
    }
  }

  for (const member of node.members) {
    // Constructor
    if (ts.isConstructorDeclaration(member)) {
      hasExplicitConstructor = true;
      const params: IRParam[] = [];

      for (const param of member.parameters) {
        const paramName = param.name.getText(ctx.sourceFile);
        const paramType = param.type
          ? resolveTypeFromNode(param.type, ctx.checker, ctx.sourceFile)
          : resolveType(ctx.checker.getTypeAtLocation(param), ctx.checker);

        params.push({
          name: paramName,
          type: paramType,
          isOptional: !!param.questionToken,
        });

        const modifiers = ts.getModifiers(param);
        if (
          modifiers?.some(
            (m) =>
              m.kind === ts.SyntaxKind.PublicKeyword ||
              m.kind === ts.SyntaxKind.PrivateKeyword ||
              m.kind === ts.SyntaxKind.ProtectedKeyword ||
              m.kind === ts.SyntaxKind.ReadonlyKeyword,
          )
        ) {
          const existingField = fields.find((f) => f.name === paramName);
          if (!existingField) {
            fields.push({
              name: paramName,
              type: paramType,
              isPublic: true,
              isOptional: false,
            });
          }
        }
      }

      // Analyze the constructor body: extract `this.x = ...` assignments
      const initAssignments = new Map<string, IRNode>();
      const otherStatements: IRNode[] = [];

      if (member.body) {
        for (const stmt of member.body.statements) {
          const thisAssignment = extractThisAssignment(stmt, ctx);
          if (thisAssignment) {
            initAssignments.set(thisAssignment.field, thisAssignment.value);
          } else {
            const result = transformStatement(stmt, ctx);
            if (result) otherStatements.push(result);
          }
        }
      }

      methods.push({
        kind: "function",
        name: "init",
        params,
        returnType: { kind: "struct", name },
        body: otherStatements,
        isPublic: true,
        isMethod: true,
        isStatic: true,
        needsAllocator: false,
        isMain: false,
        initAssignments: Object.fromEntries(initAssignments),
      } as any);
    }

    // Methods
    if (ts.isMethodDeclaration(member)) {
      const methodName = member.name.getText(ctx.sourceFile);

      const params: IRParam[] = [];
      for (const param of member.parameters) {
        const paramName = param.name.getText(ctx.sourceFile);
        const paramType = param.type
          ? resolveTypeFromNode(param.type, ctx.checker, ctx.sourceFile)
          : resolveType(ctx.checker.getTypeAtLocation(param), ctx.checker);

        params.push({
          name: paramName,
          type: paramType,
          isOptional: !!param.questionToken,
        });
      }

      let returnType: IRType;
      if (member.type) {
        returnType = resolveTypeFromNode(
          member.type,
          ctx.checker,
          ctx.sourceFile,
        );
      } else {
        const sig = ctx.checker.getSignatureFromDeclaration(member);
        if (sig) {
          returnType = resolveType(
            ctx.checker.getReturnTypeOfSignature(sig),
            ctx.checker,
          );
        } else {
          returnType = { kind: "primitive", name: "void" };
        }
      }

      const fnNeedsAllocator = methodBodyAllocates(member.body, ctx);

      const body: IRNode[] = [];
      if (member.body) {
        for (const stmt of member.body.statements) {
          const result = transformStatement(stmt, ctx);
          if (result) body.push(result);
        }
      }

      const isStatic = !!member.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.StaticKeyword,
      );

      const isReadOnly = !isStatic && !methodMutatesSelf(member.body, ctx);

      if (fnNeedsAllocator) {
        returnType = { kind: "errorUnion", okType: returnType };
      }

      methods.push({
        kind: "function",
        name: methodName,
        params,
        returnType,
        body,
        isPublic: true,
        isMethod: true,
        isStatic,
        isReadOnly,
        needsAllocator: fnNeedsAllocator,
        isMain: false,
      });
    }
  }

  if (!hasExplicitConstructor) {
    methods.unshift({
      kind: "function",
      name: "init",
      params: [],
      returnType: { kind: "struct", name },
      body: [],
      isPublic: true,
      isMethod: true,
      isStatic: true,
      needsAllocator: false,
      isMain: false,
    });
  }

  return {
    kind: "struct",
    name,
    fields,
    methods,
    isPublic: ctx.exports.has(name),
    hasInit: true,
  };
}

function extractThisAssignment(
  stmt: ts.Statement,
  ctx: TransformContext,
): { field: string; value: IRNode } | null {
  if (!ts.isExpressionStatement(stmt)) return null;
  const expr = stmt.expression;
  if (!ts.isBinaryExpression(expr)) return null;
  if (expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return null;

  const left = expr.left;
  if (!ts.isPropertyAccessExpression(left)) return null;
  if (left.expression.kind !== ts.SyntaxKind.ThisKeyword) return null;

  const fieldName = left.name.text;
  const value = transformExpression(expr.right, ctx);

  return { field: fieldName, value };
}

function methodBodyAllocates(
  body: ts.Block | undefined,
  ctx: TransformContext,
): boolean {
  if (!body) return false;
  let allocates = false;

  function visit(node: ts.Node) {
    if (allocates) return;

    if (ts.isArrayLiteralExpression(node)) {
      allocates = true;
      return;
    }

    if (ts.isTemplateExpression(node)) {
      allocates = true;
      return;
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const leftType = ctx.checker.getTypeAtLocation(node.left);
      if (
        leftType.flags & ts.TypeFlags.String ||
        leftType.flags & ts.TypeFlags.StringLiteral
      ) {
        allocates = true;
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(body, visit);
  return allocates;
}

function methodMutatesSelf(
  body: ts.Block | undefined,
  ctx: TransformContext,
): boolean {
  if (!body) return false;
  let mutates = false;

  function visit(node: ts.Node): void {
    if (mutates) return;

    if (
      ts.isBinaryExpression(node) &&
      isAssignmentOperatorKind(node.operatorToken.kind) &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.expression.kind === ts.SyntaxKind.ThisKeyword
    ) {
      mutates = true;
      return;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.kind === ts.SyntaxKind.ThisKeyword
    ) {
      mutates = true;
      return;
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(body, visit);
  return mutates;
}

function isAssignmentOperatorKind(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsToken ||
    kind === ts.SyntaxKind.PlusEqualsToken ||
    kind === ts.SyntaxKind.MinusEqualsToken ||
    kind === ts.SyntaxKind.AsteriskEqualsToken ||
    kind === ts.SyntaxKind.SlashEqualsToken ||
    kind === ts.SyntaxKind.PercentEqualsToken ||
    kind === ts.SyntaxKind.AmpersandEqualsToken ||
    kind === ts.SyntaxKind.BarEqualsToken ||
    kind === ts.SyntaxKind.CaretEqualsToken
  );
}
