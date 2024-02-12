pub struct DoWhileOptions {
  handler: inflight(): void;
  condition: inflight(): bool;
}

pub class Util {
  pub inflight static do_while(options: DoWhileOptions) {
    let var firstFinished = false;
    while !firstFinished || options.condition() {
      options.handler();
      firstFinished = true;
    }
  }
}
