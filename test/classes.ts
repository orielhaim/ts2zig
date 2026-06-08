export class Counter {
  private value: number = 0;

  increment(): number {
    this.value++;
    return this.value;
  }

  get(): number {
    return this.value;
  }
}

export class Point {
  constructor(
    public x: number,
    public y: number,
  ) {}

  length(): number {
    return this.x * this.x + this.y * this.y;
  }
}
