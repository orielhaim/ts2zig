import { Counter, Point } from "./classes";
import { processEntities } from "./polymorphism";
import { createEntity } from "./factories";
import { World } from "./runtime_graph";

function main(): void {
  const counter = new Counter();

  counter.increment();
  counter.increment();

  const p = new Point(3, 4);

  console.log("Counter:", counter.get());
  console.log("Point:", p.length());

  const results = processEntities();

  for (const r of results) {
    console.log(r);
  }

  const world = new World();

  world.add(createEntity("player", "Alice"));
  world.add(createEntity("enemy", "Zombie"));

  const run = world.run();

  for (const line of run) {
    console.log(line);
  }

  const found = world.find("Alice");

  if (found !== null) {
    console.log("FOUND:", found.describe());
  }
}

main();
