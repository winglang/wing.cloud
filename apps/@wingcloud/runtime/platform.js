/* eslint-disable unicorn/prefer-module */
const { createHash } = require("node:crypto");

const { ENDPOINT_FQN } = require("@winglang/sdk/lib/cloud");
const { REACT_APP_FQN } = require("@winglang/sdk/lib/ex");
const { Endpoint } = require("@winglang/sdk/lib/target-sim/endpoint");
const { ReactApp } = require("@winglang/sdk/lib/target-sim/react-app");

exports.Platform = class Platform {
  target = "sim";

  newInstance(type, scope, id, ...args) {
    if (type === ENDPOINT_FQN) {
      class CustomEndpoint extends Endpoint {
        get url() {
          const environmentId = process.env["ENVIRONMENT_ID"];

          const digest = createHash("sha256")
            .update(`${environmentId}-${this.node.path}`)
            .digest("hex")
            .slice(0, 16);

          return `https://${digest}.wingcloud.io`;
        }
      }

      return new CustomEndpoint(scope, id, ...args);
    } else if (type === REACT_APP_FQN) {
      return new ReactApp(
        scope,
        id,
        Object.assign({}, props, {
          useBuildCommand: true,
        }),
      );
    }
  }
};
