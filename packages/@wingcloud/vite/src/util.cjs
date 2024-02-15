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

exports.recursiveReadDir = (dir, files = []) => {
  const fs = require("node:fs");
  const path = require("node:path");

  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      files = exports.recursiveReadDir(filePath, files);
    } else {
      files.push(filePath);
    }
  });

  return files;
};

const { contentType } = require("mime-types");
const { extname } = require("node:path");
exports.contentType = (filename) => {
  return contentType(extname(filename));
};
