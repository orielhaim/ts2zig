export function greet(name: string): string {
  return "Hello, " + name + "!";
}

export function templateGreet(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old!`;
}

export function multiConcat(a: string, b: string, c: string): string {
  return a + " " + b + " " + c;
}

export function stringCompare(a: string, b: string): boolean {
  return a === b;
}

export function stringNotEqual(a: string, b: string): boolean {
  return a !== b;
}

export function emptyString(): string {
  return "";
}

export function nestedTemplate(first: string, last: string): string {
  const full = `${first} ${last}`;
  return `Name: ${full}`;
}
