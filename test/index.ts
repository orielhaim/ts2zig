import { BankAccount, factorial, double, isRich, type Person } from "./models";

import { map, filter } from "./utils";

function getBalance(account: BankAccount): number {
  return account.getBalance();
}

function main(): void {
  const people: Person[] = [
    {
      id: 101,
      name: "Alice",
    },
    {
      id: 102,
      name: "Bob",
    },
    {
      id: 103,
      name: "Charlie",
    },
  ];

  const accounts: BankAccount[] = [];

  for (const person of people) {
    const account = BankAccount.create(person, person.id * 10);

    account.deposit(50);
    account.withdraw(25);

    accounts.push(account);
  }

  const balances = map(accounts, getBalance);

  const doubledBalances = map(balances, double);

  const richBalances = filter(doubledBalances, isRich);

  const stats = {
    accountCount: accounts.length,
    totalBalance: 0,
  };

  for (const value of doubledBalances) {
    stats.totalBalance += value;
  }

  console.log("Balances:");

  for (const value of balances) {
    console.log(value);
  }

  console.log("Doubled:");

  for (const value of doubledBalances) {
    console.log(value);
  }

  console.log("Rich:");

  for (const value of richBalances) {
    console.log(value);
  }

  console.log(`accounts=${stats.accountCount}`);

  console.log(`total=${stats.totalBalance}`);

  console.log(`factorial(6)=${factorial(6)}`);

  if (stats.totalBalance > 5000) {
    console.log("large bank");
  } else {
    console.log("small bank");
  }
}

main();
