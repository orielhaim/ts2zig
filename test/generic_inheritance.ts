export abstract class Collection<T> {
  protected items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  size(): number {
    return this.items.length;
  }

  abstract describe(): string;
}

export class NumberCollection extends Collection<number> {
  sum(): number {
    let total = 0;
    for (const n of this.items) {
      total += n;
    }
    return total;
  }

  describe(): string {
    return `NumberCollection(${this.items.length})`;
  }
}

export class StringCollection extends Collection<string> {
  joinAll(separator: string): string {
    let result = "";
    let first = true;
    for (const s of this.items) {
      if (!first) {
        result = result + separator;
      }
      result = result + s;
      first = false;
    }
    return result;
  }

  describe(): string {
    return `StringCollection(${this.items.length})`;
  }
}
