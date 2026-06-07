import * as ts from "typescript";
import type { IRType } from "../types";

export function resolveType(type: ts.Type, checker: ts.TypeChecker): IRType {
  if (type.flags & ts.TypeFlags.Null || type.flags & ts.TypeFlags.Undefined) {
    return { kind: "optional", inner: { kind: "primitive", name: "void" } };
  }

  if (type.flags & ts.TypeFlags.Void) {
    return { kind: "primitive", name: "void" };
  }

  if (
    type.flags & ts.TypeFlags.Boolean ||
    type.flags & ts.TypeFlags.BooleanLiteral
  ) {
    return { kind: "primitive", name: "bool" };
  }

  if (
    type.flags & ts.TypeFlags.Number ||
    type.flags & ts.TypeFlags.NumberLiteral
  ) {
    return { kind: "primitive", name: "f64" };
  }

  if (
    type.flags & ts.TypeFlags.String ||
    type.flags & ts.TypeFlags.StringLiteral
  ) {
    return { kind: "string" };
  }

  if (type.isUnion()) {
    const types = type.types;

    const nonNullTypes = types.filter(
      (t) =>
        !(t.flags & ts.TypeFlags.Null) && !(t.flags & ts.TypeFlags.Undefined),
    );
    const hasNull = types.some(
      (t) =>
        !!(t.flags & ts.TypeFlags.Null) || !!(t.flags & ts.TypeFlags.Undefined),
    );

    if (hasNull && nonNullTypes.length === 1) {
      const inner = resolveType(nonNullTypes[0], checker);
      return { kind: "optional", inner };
    }

    if (
      types.length === 2 &&
      types.every((t) => !!(t.flags & ts.TypeFlags.BooleanLiteral))
    ) {
      return { kind: "primitive", name: "bool" };
    }

    return { kind: "unknown" };
  }

  if (checker.isArrayType(type)) {
    const typeArgs = (type as ts.TypeReference).typeArguments;
    if (typeArgs && typeArgs.length > 0) {
      const elementType = resolveType(typeArgs[0], checker);
      return { kind: "array", elementType };
    }
    return { kind: "array", elementType: { kind: "unknown" } };
  }

  if (type.flags & ts.TypeFlags.Object) {
    const symbol = type.getSymbol();

    if (symbol) {
      const name = symbol.getName();

      if (name && name !== "__type" && name !== "__object") {
        return { kind: "struct", name };
      }
    }

    return { kind: "struct", name: "AnonymousStruct" };
  }

  if (type.flags & ts.TypeFlags.Any) {
    return { kind: "anyopaque" };
  }

  if (type.flags & ts.TypeFlags.Unknown) {
    return { kind: "unknown" };
  }

  if (type.flags & ts.TypeFlags.Never) {
    return { kind: "primitive", name: "void" };
  }

  if (type.flags & ts.TypeFlags.Enum || type.flags & ts.TypeFlags.EnumLiteral) {
    const symbol = type.getSymbol();
    return { kind: "enum", name: symbol?.getName() ?? "UnknownEnum" };
  }

  return { kind: "unknown" };
}

export function resolveTypeFromNode(
  node: ts.TypeNode | undefined,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
): IRType {
  if (!node) return { kind: "unknown" };

  if (ts.isTypeReferenceNode(node)) {
    const typeName = node.typeName.getText(sourceFile);

    // Array<T>
    if (typeName === "Array" && node.typeArguments?.length === 1) {
      const elementType = resolveTypeFromNode(
        node.typeArguments[0],
        checker,
        sourceFile,
      );
      return { kind: "array", elementType };
    }

    return { kind: "struct", name: typeName };
  }

  if (ts.isArrayTypeNode(node)) {
    const elementType = resolveTypeFromNode(
      node.elementType,
      checker,
      sourceFile,
    );
    return { kind: "array", elementType };
  }

  if (ts.isUnionTypeNode(node)) {
    const types = node.types;
    const nonNullTypes = types.filter(
      (t) =>
        !(
          ts.isLiteralTypeNode(t) &&
          t.literal.kind === ts.SyntaxKind.NullKeyword
        ) && t.kind !== ts.SyntaxKind.UndefinedKeyword,
    );
    const hasNull = types.some(
      (t) =>
        (ts.isLiteralTypeNode(t) &&
          t.literal.kind === ts.SyntaxKind.NullKeyword) ||
        t.kind === ts.SyntaxKind.UndefinedKeyword,
    );

    if (hasNull && nonNullTypes.length === 1) {
      const inner = resolveTypeFromNode(nonNullTypes[0], checker, sourceFile);
      return { kind: "optional", inner };
    }

    return { kind: "unknown" };
  }

  const keyword = node.kind;
  switch (keyword) {
    case ts.SyntaxKind.NumberKeyword:
      return { kind: "primitive", name: "f64" };
    case ts.SyntaxKind.StringKeyword:
      return { kind: "string" };
    case ts.SyntaxKind.BooleanKeyword:
      return { kind: "primitive", name: "bool" };
    case ts.SyntaxKind.VoidKeyword:
      return { kind: "primitive", name: "void" };
    case ts.SyntaxKind.NullKeyword:
    case ts.SyntaxKind.UndefinedKeyword:
      return { kind: "optional", inner: { kind: "primitive", name: "void" } };
    default:
      return { kind: "unknown" };
  }
}

export function needsAllocator(type: IRType): boolean {
  switch (type.kind) {
    case "string":
    case "array":
      return true;
    case "optional":
      return needsAllocator(type.inner);
    case "errorUnion":
      return needsAllocator(type.okType);
    case "struct":
      return true;
    default:
      return false;
  }
}
