// Primitive types, variables, constants, and basic operations
export type UserID = number;
export type UserName = string;
export type IsActive = boolean;

export function integerArithmetic(a: number, b: number): number {
  const sum = a + b;
  const diff = a - b;
  const product = a * b;
  const quotient = a / b;
  const remainder = a % b;
  return sum + diff + product + quotient + remainder;
}

export function booleanLogic(a: boolean, b: boolean): boolean {
  const and = a && b;
  const or = a || b;
  const not = !a;
  return (and || or) && not;
}

export function comparisonOps(x: number, y: number): boolean {
  const lt = x < y;
  const lte = x <= y;
  const gt = x > y;
  const gte = x >= y;
  const eq = x === y;
  const neq = x !== y;
  return lt || lte || gt || gte || eq || neq;
}

export function letVsMut(): number {
  const immutable = 10;
  let mutable = 20;
  mutable = mutable + immutable;
  mutable += 5;
  mutable -= 3;
  mutable *= 2;
  mutable /= 4;
  return mutable;
}

export function unaryOps(x: number): number {
  const neg = -x;
  const pos = +x;
  return neg + pos;
}

export function postfixOps(): number {
  let counter = 0;
  counter++;
  counter++;
  counter--;
  return counter;
}
