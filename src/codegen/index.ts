import type { IRModule, Diagnostic } from "../types";
import { ZigWriter } from "./writer";
import { generateNode, resetTempCounter } from "./zig-ast";

export function generateZig(
  module: IRModule,
  diagnostics: Diagnostic[],
): string {
  resetTempCounter();
  const w = new ZigWriter();

  w.writeLine('const std = @import("std");');
  w.writeLine('const _rt = @import("_runtime.zig");');

  const importedNames = new Map<string, string>();

  for (const imp of module.imports) {
    const alias = imp.source
      .replace(/\.zig$/, "")
      .replace(/[^a-zA-Z0-9_]/g, "_");
    w.writeLine(`const ${alias} = @import("${imp.source}");`);

    for (const name of imp.names) {
      importedNames.set(name, alias);
    }
  }

  w.writeLine("");

  if (module.errors.length > 0) {
    const errors = module.errors.join(", ");
    w.writeLine(`const AppError = error{ ${errors} };`);
    w.writeLine("");
  }

  for (const [name, alias] of importedNames) {
    w.writeLine(`const ${name} = ${alias}.${name};`);
  }
  if (importedNames.size > 0) {
    w.writeLine("");
  }

  for (const node of module.body) {
    generateNode(node, w, diagnostics, 0);
    w.writeLine("");
  }

  switch (module.moduleKind) {
    case "executable":
      generateExecutableEntry(module, w, diagnostics);
      break;
    case "script":
      generateScriptEntry(module, w, diagnostics);
      break;
    case "library":
      break;
  }

  return w.toString();
}

function generateExecutableEntry(
  module: IRModule,
  w: ZigWriter,
  diagnostics: Diagnostic[],
): void {
  w.writeLine("pub fn main() !void {");
  w.indent();
  w.writeLine(
    "var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);",
  );
  w.writeLine("defer arena.deinit();");
  w.writeLine("const allocator = arena.allocator();");

  if (module.scriptBody.length > 0) {
    w.writeLine("");
    for (const node of module.scriptBody) {
      generateEntryNode(node, w, diagnostics);
    }
  } else {
    w.writeLine("try tszig_main(allocator);");
  }

  w.dedent();
  w.writeLine("}");
}

function generateScriptEntry(
  module: IRModule,
  w: ZigWriter,
  diagnostics: Diagnostic[],
): void {
  const needsAllocator = scriptBodyNeedsAllocator(module.scriptBody);

  w.writeLine("pub fn main() !void {");
  w.indent();

  if (needsAllocator) {
    w.writeLine(
      "var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);",
    );
    w.writeLine("defer arena.deinit();");
    w.writeLine("const allocator = arena.allocator();");
  }

  w.writeLine("");

  for (const node of module.scriptBody) {
    generateNode(node, w, diagnostics, 1);
  }

  w.dedent();
  w.writeLine("}");
}

function generateEntryNode(
  node: any,
  w: ZigWriter,
  diagnostics: Diagnostic[],
): void {
  if (isMainCall(node)) {
    w.writeLine("try tszig_main(allocator);");
    return;
  }

  if (node.kind === "expressionStatement" && isMainCall(node.expression)) {
    w.writeLine("try tszig_main(allocator);");
    return;
  }

  generateNode(node, w, diagnostics, 1);
}

function isMainCall(node: any): boolean {
  if (!node) return false;
  if (node.kind !== "call") return false;
  const callee = node.callee;
  if (!callee) return false;
  if (callee.kind === "identifier" && callee.name === "main") return true;
  if (callee.kind === "member" && callee.property === "main") return true;
  return false;
}

function scriptBodyNeedsAllocator(nodes: any[]): boolean {
  for (const node of nodes) {
    if (deepNeedsAllocator(node)) return true;
  }
  return false;
}

function deepNeedsAllocator(node: any): boolean {
  if (!node || typeof node !== "object") return false;
  if (node.kind === "arrayLiteral") return true;
  if (node.kind === "templateLiteral") return true;
  if (node.kind === "variable" && node.needsDefer) return true;
  if (
    node.kind === "binary" &&
    node.operator === "+" &&
    (isStringTyped(node.left) || isStringTyped(node.right))
  ) {
    return true;
  }
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (deepNeedsAllocator(item)) return true;
      }
    } else if (val && typeof val === "object" && val.kind) {
      if (deepNeedsAllocator(val)) return true;
    }
  }
  return false;
}

function isStringTyped(node: any): boolean {
  if (!node) return false;
  if (node.kind === "literal" && typeof node.value === "string") return true;
  if (node.type?.kind === "string") return true;
  if (node.kind === "templateLiteral") return true;
  return false;
}
