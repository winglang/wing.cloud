const child_process = require("node:child_process");

exports.spawnSync = (options) => {
  child_process.spawnSync(options.command, options.arguments, {
    cwd: options.cwd,
    env: options.env,
    stdio: "inherit",
  });
};

exports.spawn = (options) => {
  let child = child_process.spawn(options.command, options.arguments, {
    cwd: options.cwd,
    env: options.env,
  });

  child.stdout.on("data", (data) => options.onData?.(data.toString()));
  child.stderr.on("data", (data) => options.onData?.(data.toString()));

  return child;
};

exports.getURLFromText = (url) => {
  return url.match(/(https?:\/\/[^\s]+)/)?.[0];
};
