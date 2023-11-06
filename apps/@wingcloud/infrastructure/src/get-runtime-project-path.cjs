const { join } = require("path");

module.exports.getRuntimeProjectPath = (obj) => {
  return join(obj.node.root.node.children[0].node.children[0].entrypointDir, "../runtime");
};
