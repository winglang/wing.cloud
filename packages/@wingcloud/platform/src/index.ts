import { Platform as TestPlatform } from './platform-test';
import { Platform as DevPlatform } from './platform-dev';

const WING_ENV = process.env["WING_ENV"] || "development";

enum WingEnv {
  Development = "development",
  Test = "test",
}

export const Platform = WING_ENV === WingEnv.Development ? DevPlatform : TestPlatform