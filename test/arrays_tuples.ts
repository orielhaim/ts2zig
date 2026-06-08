export function sumArray(nums: number[]): number {
  let total = 0;
  for (const n of nums) {
    total += n;
  }
  return total;
}

export function arrayPush(): number[] {
  const arr: number[] = [];
  arr.push(10);
  arr.push(20);
  arr.push(30);
  return arr;
}

export function arrayLength(items: string[]): number {
  return items.length;
}

export function makeTuple(a: number, b: string): [number, string] {
  return [a, b];
}

export function makeTriple(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [x, y, z];
}

export function emptyArrayInit(): number[] {
  const result: number[] = [];
  return result;
}

export function buildStringArray(): string[] {
  const words: string[] = [];
  words.push("hello");
  words.push("world");
  return words;
}

export function arrayOfBooleans(): boolean[] {
  const flags: boolean[] = [true, false, true];
  return flags;
}
