// const lambda = require("@cdktf/provider-aws/lib/lambda-f");
const cdktf = require("cdktf");

// compatibleTargets not currently used see: https://github.com/winglang/wing/issues/1474
exports.compatibleTargets = ["tf-aws"];

class OverrideFunctionMemory {
  visit(node) {
    if (node.terraformResourceType === "aws_lambda_function") {
      node.memorySize = 1024;
    }
  }
}

exports.preSynth = function (app) {
  cdktf.Aspects.of(app).add(new OverrideFunctionMemory());
};
