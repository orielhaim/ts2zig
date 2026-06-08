export function identity<T>(value: T): T {
  return value;
}

export function firstElement<T>(arr: T[]): T {
  return arr[0];
}

export function makePair<T>(a: T, b: T): [T, T] {
  return [a, b];
}

export class Box<T> {
  private item: T;

  constructor(item: T) {
    this.item = item;
  }

  get(): T {
    return this.item;
  }

  set(value: T): void {
    this.item = value;
  }
}

export class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  size(): number {
    return this.items.length;
  }
}

export function useBox(): number {
  const box = new Box<number>(42);
  return box.get();
}

export function useStringBox(): string {
  const box = new Box<string>("hello");
  return box.get();
}
