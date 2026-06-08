export interface Vec2 {
  x: number;
  y: number;
}

export interface Config {
  width: number;
  height: number;
  title: string;
  fullscreen: boolean;
}

export interface OptionalConfig {
  name: string;
  debug?: boolean;
  verbose?: boolean;
}

export function createVec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function dotProduct(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function describeConfig(c: Config): string {
  return `${c.title}: ${c.width}x${c.height}`;
}

export function createDefaultConfig(): Config {
  return {
    width: 800,
    height: 600,
    title: "App",
    fullscreen: false,
  };
}
