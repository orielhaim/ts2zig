export enum State {
  Idle,
  Running,
  Paused,
  Stopped,
}

export class StateMachine {
  private state: State = State.Idle;
  private ticks: number = 0;

  current(): State {
    return this.state;
  }

  start(): boolean {
    if (this.state === State.Idle || this.state === State.Paused) {
      this.state = State.Running;
      return true;
    }
    return false;
  }

  pause(): boolean {
    if (this.state === State.Running) {
      this.state = State.Paused;
      return true;
    }
    return false;
  }

  stop(): boolean {
    if (this.state !== State.Stopped) {
      this.state = State.Stopped;
      return true;
    }
    return false;
  }

  tick(): void {
    if (this.state === State.Running) {
      this.ticks++;
    }
  }

  getTicks(): number {
    return this.ticks;
  }

  stateName(): string {
    switch (this.state) {
      case State.Idle:
        return "Idle";
      case State.Running:
        return "Running";
      case State.Paused:
        return "Paused";
      case State.Stopped:
        return "Stopped";
      default:
        return "Unknown";
    }
  }
}

export function runStateMachine(): string[] {
  const sm = new StateMachine();
  const log: string[] = [];

  log.push(sm.stateName());
  sm.start();
  log.push(sm.stateName());

  sm.tick();
  sm.tick();
  sm.tick();

  sm.pause();
  log.push(sm.stateName());

  sm.tick(); // should not count

  sm.start();
  sm.tick();

  sm.stop();
  log.push(sm.stateName());

  return log;
}
