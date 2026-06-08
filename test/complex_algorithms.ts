export function bubbleSort(arr: number[]): number[] {
  const result: number[] = [];
  for (const v of arr) {
    result.push(v);
  }

  let n = result.length;
  let swapped = true;

  while (swapped) {
    swapped = false;
    for (let i = 1; i < n; i++) {
      const a = result[i - 1];
      const b = result[i];
      if (a > b) {
        result[i - 1] = b;
        result[i] = a;
        swapped = true;
      }
    }
    n = n - 1;
  }

  return result;
}

export function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;

  let i = 2;
  while (i * i <= n) {
    if (n % i === 0) {
      return false;
    }
    i++;
  }
  return true;
}

export function gcd(a: number, b: number): number {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

export function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function collatzSteps(n: number): number {
  let steps = 0;
  let current = n;
  while (current !== 1) {
    if (current % 2 === 0) {
      current = current / 2;
    } else {
      current = 3 * current + 1;
    }
    steps++;
  }
  return steps;
}
