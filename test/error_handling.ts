export function safeDivide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

export function validateAge(age: number): string {
  if (age < 0) {
    throw new Error("NegativeAge");
  }
  if (age > 150) {
    throw new Error("UnrealisticAge");
  }
  return "valid";
}

export function tryCatchExample(): string {
  try {
    const result = safeDivide(10, 0);
    return `Result: ${result}`;
  } catch (e) {
    return "caught error";
  }
}

export function multipleThrows(x: number): string {
  if (x < 0) {
    throw new Error("TooSmall");
  }
  if (x > 1000) {
    throw new Error("TooBig");
  }
  return "ok";
}
