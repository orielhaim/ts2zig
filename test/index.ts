import { Calculator, greet, type User } from "./math";

function main(): void {
  const calc = new Calculator();

  const a = calc.add(10, 20);
  const b = calc.multiply(a, 2);

  console.log(`a = ${a}`);
  console.log(`b = ${b}`);

  const numbers: number[] = [10, 20, 30, 40];
  const avg = Calculator.average(numbers);

  console.log(`average = ${avg}`);

  const user: User = {
    id: 1,
    name: "Oriel",
  };

  console.log(greet(user));
  console.log(greet(user, "Welcome"));

  for (const entry of calc.getHistory()) {
    console.log(`history: ${entry}`);
  }

  if (avg > 20) {
    console.log("average is high");
  } else {
    console.log("average is low");
  }
}

main();
