export type ID = number;

export function add(a: number, b: number): number {
  return a + b;
}

export function identity<T>(value: T): T {
  return value;
}

export function makePair(a: number, b: number): [number, number] {
  return [a, b];
}
