export interface User {
  id: number;
  name: string;
}

export class Calculator {
  private history: string[] = [];

  add(a: number, b: number): number {
    const result = a + b;
    this.history.push(`${a} + ${b} = ${result}`);
    return result;
  }

  multiply(a: number, b: number): number {
    const result = a * b;
    this.history.push(`${a} * ${b} = ${result}`);
    return result;
  }

  getHistory(): string[] {
    return this.history;
  }

  static average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    let sum = 0;

    for (const value of values) {
      sum += value;
    }

    return sum / values.length;
  }
}

export function greet(user: User, prefix?: string): string {
  const start = prefix ?? "Hello";
  return `${start}, ${user.name}!`;
}
