export function absoluteValue(x: number): number {
  if (x < 0) {
    return -x;
  }
  return x;
}

export function classifyNumber(x: number): string {
  if (x > 0) {
    return "positive";
  } else if (x < 0) {
    return "negative";
  } else {
    return "zero";
  }
}

export function whileSum(n: number): number {
  let sum = 0;
  let i = 1;
  while (i <= n) {
    sum += i;
    i++;
  }
  return sum;
}

export function forRangeSum(n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += i;
  }
  return sum;
}

export function forOfExample(items: string[]): string {
  let result = "";
  for (const item of items) {
    result = result + item + " ";
  }
  return result;
}

export function earlyReturn(values: number[]): number {
  for (const v of values) {
    if (v > 100) {
      return v;
    }
  }
  return -1;
}

export function switchStatement(day: number): string {
  switch (day) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    default:
      return "Unknown";
  }
}

export function nestedIf(x: number, y: number): string {
  if (x > 0) {
    if (y > 0) {
      return "both positive";
    } else {
      return "x positive, y not";
    }
  } else {
    if (y > 0) {
      return "y positive, x not";
    } else {
      return "neither positive";
    }
  }
}

export function fibonacci(n: number): number {
  if (n <= 1) return n;

  let a = 0;
  let b = 1;

  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}
