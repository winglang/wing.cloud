export interface Log {
  time: string;
  message: string;
}

export interface LoggerInterface {
  logs: Log[];
  log: (message: string, props?: any[]) => void;
}

export class Logger implements LoggerInterface {
  logs: Log[] = [];

  constructor() {}

  log = (message: string, props?: any[]) => {
    const time = new Date().toISOString();
    const log = { time, message };
    this.logs.push(log);
  };
}
