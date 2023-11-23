export interface Log {
  time: string;
  message: string;
}

export interface LoggerInterface {
  log: (message: string, props?: any[]) => void;
}
