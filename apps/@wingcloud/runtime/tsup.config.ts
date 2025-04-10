/* eslint-disable prettier/prettier */
import { defineConfig } from "tsup";

export default defineConfig({
  "entry": [
    "src/**/*.ts"
  ],
  "outDir": "lib",
  "format": [
    "esm"
  ],
  "target": "node20",
  "dts": true,
  "bundle": false,
  "clean": true
});
