import { Entity, Player, Enemy } from "./inheritance";

export function createEntity(type: string, name: string): Entity {
  if (type === "player") {
    return new Player(name);
  }

  return new Enemy(name);
}

export function cloneEntity(e: Entity): Entity {
  return createEntity(e.kind().toLowerCase(), e.name);
}
