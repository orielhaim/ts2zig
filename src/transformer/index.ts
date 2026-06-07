import * as ts from "typescript";
import type { AnalysisResult } from "../analyzer";
import type { Diagnostic, IRModule, IRNode, IRImport } from "../types";
import { transformFunction } from "./passes/functions";
import { transformClass } from "./passes/classes";
import { transformInterface, transformTypeAlias } from "./passes/types";
import { transformEnum } from "./passes/enums";
import { transformVariable } from "./passes/variables";
import { transformStatement } from "./passes/statements";
import { transformImport } from "./passes/modules";

export function transformToIR(
  analysis: AnalysisResult,
  checker: ts.TypeChecker,
  diagnostics: Diagnostic[],
): IRModule {
  const ctx: TransformContext = {
    checker,
    sourceFile: analysis.sourceFile,
    diagnostics,
    exports: analysis.exports,
    errors: new Set<string>(),
  };

  const body: IRNode[] = [];
  const scriptBody: IRNode[] = [];
  const imports: IRImport[] = [];

  for (const imp of analysis.imports) {
    const result = transformImport(imp, ctx);
    if (result) imports.push(result);
  }

  for (const en of analysis.enums) {
    const result = transformEnum(en, ctx);
    if (result) body.push(result);
  }

  for (const iface of analysis.interfaces) {
    const result = transformInterface(iface, ctx);
    if (result) body.push(result);
  }

  for (const alias of analysis.typeAliases) {
    const result = transformTypeAlias(alias, ctx);
    if (result) body.push(result);
  }

  for (const cls of analysis.classes) {
    const result = transformClass(cls, ctx);
    if (result) body.push(result);
  }

  for (const fn of analysis.functions) {
    const result = transformFunction(fn, ctx);
    if (result) body.push(result);
  }

  switch (analysis.moduleKind) {
    case "library": {
      for (const varStmt of analysis.variables) {
        for (const decl of varStmt.declarationList.declarations) {
          const result = transformVariable(decl, varStmt, ctx);
          if (result) body.push(result);
        }
      }
      for (const stmt of analysis.topLevelStatements) {
        const result = transformStatement(stmt, ctx);
        if (result) body.push(result);
      }
      break;
    }

    case "executable": {
      for (const varStmt of analysis.variables) {
        for (const decl of varStmt.declarationList.declarations) {
          const result = transformVariable(decl, varStmt, ctx);
          if (result) body.push(result);
        }
      }
      for (const stmt of analysis.topLevelStatements) {
        const result = transformStatement(stmt, ctx);
        if (result) scriptBody.push(result);
      }
      break;
    }

    case "script": {
      collectOrderedScriptNodes(analysis, ctx, body, scriptBody);
      break;
    }
  }

  return {
    kind: "module",
    fileName: analysis.sourceFile.fileName,
    imports,
    body,
    errors: Array.from(ctx.errors),
    hasMain: analysis.hasMainFunction,
    moduleKind: analysis.moduleKind,
    scriptBody,
  };
}

function collectOrderedScriptNodes(
  analysis: AnalysisResult,
  ctx: TransformContext,
  body: IRNode[],
  scriptBody: IRNode[],
): void {
  ts.forEachChild(analysis.sourceFile, (node) => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isImportDeclaration(node)
    ) {
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        const result = transformVariable(decl, node, ctx);
        if (result) scriptBody.push(result);
      }
      return;
    }

    const result = transformStatement(node, ctx);
    if (result) scriptBody.push(result);
  });
}

export interface TransformContext {
  checker: ts.TypeChecker;
  sourceFile: ts.SourceFile;
  diagnostics: Diagnostic[];
  exports: Set<string>;
  errors: Set<string>;
}
