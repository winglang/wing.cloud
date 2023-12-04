import { Platform as TestPlatform } from './platform-test';
import { Platform as Production } from './platform-production';

const WING_ENV = process.env["WING_ENV"] || "production";

enum WingEnv {
  Production = "production",
  Test = "test",
}

if (WING_ENV !== WingEnv.Production && WING_ENV !== WingEnv.Test) {
  throw new Error(`WING_ENV must be either ${WingEnv.Production} or ${WingEnv.Test}`);
}

export const Platform = WING_ENV === WingEnv.Production ? Production : TestPlatform