export function logPrimitives(): void {
  console.log("hello");
  console.log(42);
  console.log(true);
  console.log(3.14);
}

export function logMultipleArgs(): void {
  console.log("Name:", "Alice");
  console.log("Score:", 100);
  console.log("Active:", true);
}

export function logTemplate(name: string, score: number): void {
  console.log(`Player ${name} scored ${score} points`);
}

export function logEmpty(): void {
  console.log();
}

export function logComputed(a: number, b: number): void {
  const sum = a + b;
  console.log("Sum:", sum);
}
