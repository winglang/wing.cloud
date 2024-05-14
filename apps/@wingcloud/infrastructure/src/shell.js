//
// This file is plain JS because it has externs that are used preflight
//
const child_process = require("node:child_process");

module.exports.entrypointDir = function (obj) {
  return obj.node.root.entrypointDir;
};

module.exports.shell = async function (command, args, cwd) {
  return new Promise((resolve, reject) => {
    const env = Object.assign({}, process.env, {
      PATH: `${process.env.PATH}:/usr/local/bin`,
    });

    console.log("execFile", command, args, { cwd, env });
    child_process.execFile(
      command,
      args,
      { cwd, env },
      (error, stdout, stderr) => {
        if (error) {
          console.error("Shell Error:", error);
          console.error("Stderr:", stderr);
          console.error();
          return reject(error);
        }
        return resolve(stdout ?? stderr);
      },
    );
  });
};
