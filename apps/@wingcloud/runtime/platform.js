/* eslint-disable unicorn/prefer-module */
const { createHash } = require("node:crypto");

const { ENDPOINT_FQN } = require("@winglang/sdk/lib/cloud");
const { Endpoint } = require("@winglang/sdk/lib/target-sim/endpoint");

exports.Platform = class Platform {
  target = "sim";

  newInstance(type, scope, id, ...args) {
    if (type === ENDPOINT_FQN) {
      class CustomEndpoint extends Endpoint {
        get url() {
          const environmentId = process.env["ENVIRONMENT_ID"];
          const publicEndpointDomain = process.env["PUBLIC_ENDPOINT_DOMAIN"];

          const digest = createHash("sha256")
            .update(`${environmentId}-${this.node.path}`)
            .digest("hex")
            .slice(0, 16);

          return `https://${digest}.${publicEndpointDomain}`;
        }
      }

      return new CustomEndpoint(scope, id, ...args);
    }
  }
};
