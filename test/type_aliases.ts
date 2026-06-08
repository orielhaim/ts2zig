export type Score = number;
export type Name = string;
export type Flag = boolean;

export type Pair = {
  first: number;
  second: number;
};

export type NamedValue = {
  name: string;
  value: number;
  active: boolean;
};

export function createPair(a: number, b: number): Pair {
  return { first: a, second: b };
}

export function sumPair(p: Pair): number {
  return p.first + p.second;
}

export function createNamedValue(n: string, v: number): NamedValue {
  return { name: n, value: v, active: true };
}

export function describeNamed(nv: NamedValue): string {
  return `${nv.name}: ${nv.value}`;
}

export function useScoreAlias(s: Score): Score {
  return s * 2;
}
