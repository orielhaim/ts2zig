export abstract class Shape {
  constructor(public color: string) {}

  abstract area(): number;

  describe(): string {
    return `Shape(${this.color})`;
  }
}

export class Circle extends Shape {
  constructor(
    color: string,
    public radius: number,
  ) {
    super(color);
  }

  area(): number {
    return 3.14159 * this.radius * this.radius;
  }

  describe(): string {
    return super.describe() + `:Circle(r=${this.radius})`;
  }
}

export class Square extends Shape {
  constructor(
    color: string,
    public side: number,
  ) {
    super(color);
  }

  area(): number {
    return this.side * this.side;
  }
}

export abstract class Animal {
  constructor(public name: string) {}

  abstract speak(): string;

  toString(): string {
    return `${this.name} says ${this.speak()}`;
  }
}

export class Dog extends Animal {
  speak(): string {
    return "Woof!";
  }
}

export class Cat extends Animal {
  speak(): string {
    return "Meow!";
  }
}

export function describeShapes(): string[] {
  const shapes: Shape[] = [new Circle("red", 5), new Square("blue", 4)];
  const results: string[] = [];
  for (const s of shapes) {
    results.push(s.describe());
  }
  return results;
}

export function animalSounds(): string[] {
  const animals: Animal[] = [new Dog("Rex"), new Cat("Whiskers")];
  const results: string[] = [];
  for (const a of animals) {
    results.push(a.toString());
  }
  return results;
}

export abstract class Entity {
  constructor(public name: string) {}

  abstract kind(): string;

  describe(): string {
    return "Entity:" + this.name;
  }
}

export class Player extends Entity {
  kind(): string {
    return "Player";
  }

  describe(): string {
    return super.describe() + ":Player";
  }
}

export class Enemy extends Entity {
  kind(): string {
    return "Enemy";
  }
}
