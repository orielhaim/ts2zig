import { Rectangle } from "./classes";
import { createVec2, addVec2 } from "./interfaces";
import { Direction, directionName } from "./enums";
import { identity } from "./generics";

export function crossModuleTest(): string[] {
  const results: string[] = [];

  const rect = new Rectangle(10, 5);
  results.push(rect.describe());

  const v1 = createVec2(1, 2);
  const v2 = createVec2(3, 4);
  const v3 = addVec2(v1, v2);
  results.push(`Vec: ${v3.x}, ${v3.y}`);

  const dir = Direction.Up;
  results.push(directionName(dir));

  const val = identity<number>(99);
  results.push(`Identity: ${val}`);

  return results;
}
