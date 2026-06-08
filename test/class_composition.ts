import { Vec2, createVec2 } from "./interfaces";

export class Particle {
  public position: Vec2;
  public velocity: Vec2;
  public mass: number;

  constructor(x: number, y: number, mass: number) {
    this.position = createVec2(x, y);
    this.velocity = createVec2(0, 0);
    this.mass = mass;
  }

  applyForce(fx: number, fy: number): void {
    this.velocity.x += fx / this.mass;
    this.velocity.y += fy / this.mass;
  }

  update(): void {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  describe(): string {
    return `Particle at (${this.position.x}, ${this.position.y})`;
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];

  add(p: Particle): void {
    this.particles.push(p);
  }

  tick(): void {
    for (const p of this.particles) {
      p.update();
    }
  }

  count(): number {
    return this.particles.length;
  }

  describeAll(): string[] {
    const result: string[] = [];
    for (const p of this.particles) {
      result.push(p.describe());
    }
    return result;
  }
}
