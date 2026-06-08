export interface Person {
  id: number;
  name: string;
}

export class BankAccount {
  private balance: number;

  constructor(
    public owner: Person,
    initialBalance: number,
  ) {
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  withdraw(amount: number): boolean {
    if (amount > this.balance) {
      return false;
    }

    this.balance -= amount;
    return true;
  }

  getBalance(): number {
    return this.balance;
  }

  static create(owner: Person, initialBalance: number): BankAccount {
    return new BankAccount(owner, initialBalance);
  }
}

export function factorial(n: number): number {
  if (n <= 1) {
    return 1;
  }

  return n * factorial(n - 1);
}

export function double(value: number): number {
  return value * 2;
}

export function isRich(value: number): boolean {
  return value > 1000;
}
