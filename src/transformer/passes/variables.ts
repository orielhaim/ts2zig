import * as ts from "typescript";
import type { TransformContext } from "../index";
import {
  resolveType,
  resolveTypeFromNode,
  needsAllocator,
} from "../../analyzer/type-resolver";
import { transformExpression } from "./expressions";
import type { IRVariable, IRType } from "../../types";

export function transformVariable(
  decl: ts.VariableDeclaration,
  stmt: ts.VariableStatement | null,
  ctx: TransformContext,
): IRVariable | null {
  const name = decl.name.getText(ctx.sourceFile);

  let type: IRType;
  if (decl.type) {
    type = resolveTypeFromNode(decl.type, ctx.checker, ctx.sourceFile);
  } else {
    const tsType = ctx.checker.getTypeAtLocation(decl);
    type = resolveType(tsType, ctx.checker);
  }

  const tsIsConst = !!(
    stmt?.declarationList.flags! & ts.NodeFlags.Const ||
    (!stmt &&
      decl.parent &&
      (decl.parent as ts.VariableDeclarationList).flags & ts.NodeFlags.Const)
  );

  const value = decl.initializer
    ? transformExpression(decl.initializer, ctx, type)
    : undefined;

  const needsMutable = tsIsConst && isMutableClassInstance(decl, ctx);
  const isConst = tsIsConst && !needsMutable;

  return {
    kind: "variable",
    name,
    type,
    value,
    isConst,
    needsDefer: needsAllocator(type),
  };
}

function isMutableClassInstance(
  decl: ts.VariableDeclaration,
  ctx: TransformContext,
): boolean {
  if (!decl.initializer || !ts.isNewExpression(decl.initializer)) {
    return false;
  }

  const tsType = ctx.checker.getTypeAtLocation(decl.initializer);
  const symbol = tsType.getSymbol();
  if (!symbol || !symbol.declarations) return false;

  for (const d of symbol.declarations) {
    if (ts.isClassDeclaration(d)) {
      for (const member of d.members) {
        if (
          ts.isMethodDeclaration(member) &&
          !member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}
