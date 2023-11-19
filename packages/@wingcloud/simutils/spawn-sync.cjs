const child_process = require("node:child_process");
const path = require("node:path");

exports.spawnSync_ = (command, args, options) => {
  const cwd = path.resolve(process.cwd(), options?.cwd);
  const child = child_process.spawnSync(command, args, {
    cwd,
    env: options?.env,
    stdio: "inherit",
  });

  return child;
};
