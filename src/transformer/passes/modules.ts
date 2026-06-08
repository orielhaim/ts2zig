import * as ts from "typescript";
import type { TransformContext } from "../index";
import type { IRImport } from "../../types";

export function transformImport(
  node: ts.ImportDeclaration,
  ctx: TransformContext,
): IRImport | null {
  const moduleSpecifier = node.moduleSpecifier;

  if (!ts.isStringLiteral(moduleSpecifier)) return null;

  let source = moduleSpecifier.text;

  if (!source.startsWith(".") && !source.startsWith("/")) {
    ctx.diagnostics.push({
      severity: "warning",
      message: `External module "${source}" is not supported. Skipping import.`,
      file: ctx.sourceFile.fileName,
    });
    return null;
  }

  source = source.replace(/^\.\//, "").replace(/\.ts$/, "") + ".zig";

  const names: string[] = [];
  let isDefault = false;

  if (node.importClause) {
    if (node.importClause.name) {
      names.push(node.importClause.name.text);
      isDefault = true;
    }

    if (node.importClause.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        for (const el of node.importClause.namedBindings.elements) {
          const localName = el.name.text;
          names.push(localName);
        }
      } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        names.push(node.importClause.namedBindings.name.text);
        isDefault = true;
      }
    }
  }

  return { names, source, isDefault };
}
