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
