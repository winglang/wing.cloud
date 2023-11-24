export interface Log {
  time: string;
  message: string;
  props?: any[];
}

export interface LoggerInterface {
  log: (message: string, props?: any[]) => void;
}
