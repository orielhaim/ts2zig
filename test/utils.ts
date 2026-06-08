export function map<T, U>(items: T[], fn: (item: T) => U): U[] {
  const result: U[] = [];

  for (const item of items) {
    result.push(fn(item));
  }

  return result;
}

export function filter<T>(items: T[], fn: (item: T) => boolean): T[] {
  const result: T[] = [];

  for (const item of items) {
    if (fn(item)) {
      result.push(item);
    }
  }

  return result;
}
