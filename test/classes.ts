export class Rectangle {
  constructor(
    public width: number,
    public height: number,
  ) {}

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }

  isSquare(): boolean {
    return this.width === this.height;
  }

  describe(): string {
    return `Rectangle(${this.width}, ${this.height})`;
  }
}

export class BankAccount {
  private balance: number = 0;
  private owner: string;

  constructor(owner: string, initialBalance: number) {
    this.owner = owner;
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

  getOwner(): string {
    return this.owner;
  }

  describe(): string {
    return `Account(${this.owner}): ${this.balance}`;
  }
}

export class LinkedNode {
  public value: number;
  public next: LinkedNode | null = null;

  constructor(value: number) {
    this.value = value;
  }

  append(val: number): void {
    let current: LinkedNode = this;
    while (current.next !== null) {
      current = current.next;
    }
    current.next = new LinkedNode(val);
  }
}
