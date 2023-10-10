//
// This file is plain JS because it has externs that are used preflight
//
const child_process = require("node:child_process");

module.exports.entrypointDir = function (obj) {
  return obj.node.root.entrypointDir;
};

module.exports.shell = async function (command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log("execFile", command, args, { cwd });
    child_process.execFile(command, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }

      return resolve(stdout ? stdout : stderr);
    });
  });
};
