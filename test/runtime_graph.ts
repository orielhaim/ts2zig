import { Entity } from "./inheritance";

export class World {
  private entities: Entity[] = [];

  add(e: Entity): void {
    this.entities.push(e);
  }

  count(): number {
    return this.entities.length;
  }

  run(): string[] {
    const output: string[] = [];

    for (const e of this.entities) {
      output.push(e.describe());
      output.push(e.kind());
    }

    return output;
  }

  find(name: string): Entity | null {
    for (const e of this.entities) {
      if (e.name === name) {
        return e;
      }
    }

    return null;
  }
}
