import { Entity, Player, Enemy } from "./inheritance";

export function printEntity(e: Entity): string {
  return e.describe() + " -> " + e.kind();
}

export function processEntities(): string[] {
  const entities: Entity[] = [new Player("Alice"), new Enemy("Zombie")];

  const results: string[] = [];

  for (const e of entities) {
    results.push(printEntity(e));
  }

  return results;
}
