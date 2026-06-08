export function findPositive(values: number[]): number | null {
  for (const v of values) {
    if (v > 0) {
      return v;
    }
  }
  return null;
}

export function nullableString(input: string | null): string {
  if (input !== null) {
    return input;
  }
  return "default";
}

export function maybeNumber(flag: boolean): number | null {
  if (flag) {
    return 42;
  }
  return null;
}

export function withDefault(value: number | null): number {
  return value ?? 0;
}

export function nullableChain(value: number | null): string {
  if (value !== null) {
    return `Value is ${value}`;
  }
  return "no value";
}

export function undefinedFallback(x: number | undefined): number {
  return x ?? -1;
}
