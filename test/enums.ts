export enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export enum Color {
  Red,
  Green,
  Blue,
}

export function directionName(d: Direction): string {
  switch (d) {
    case Direction.Up:
      return "up";
    case Direction.Down:
      return "down";
    case Direction.Left:
      return "left";
    case Direction.Right:
      return "right";
    default:
      return "unknown";
  }
}

export function isWarm(c: Color): boolean {
  if (c === Color.Red) {
    return true;
  }
  return false;
}

export function defaultDirection(): Direction {
  return Direction.Up;
}
