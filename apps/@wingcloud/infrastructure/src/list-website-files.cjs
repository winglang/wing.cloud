/* eslint-disable unicorn/prefer-module */
const { resolve } = require("node:path");

const { globSync } = require("glob");

exports.getFiles = () => {
  const cwd = resolve(__dirname, "../../website/lib/dist/client");
  const files = globSync("**/*", {
    cwd,
    nodir: true,
  });
  return {
    cwd,
    files,
  };
};
