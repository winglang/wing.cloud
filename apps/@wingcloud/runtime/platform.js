/* eslint-disable unicorn/prefer-module */
const { createHash } = require("node:crypto");

const { API_FQN } = require("@winglang/sdk/lib/cloud");
const { REACT_APP_FQN } = require("@winglang/sdk/lib/ex");
const { Api } = require("@winglang/sdk/lib/target-sim/api");
const { ReactApp } = require("@winglang/sdk/lib/target-sim/react-app");

exports.Platform = class Platform {
  target = "sim";

  newInstance(type, scope, id, props) {
    if (type === API_FQN) {
      class CustomApi extends Api {
        get url() {
          const environmentId = process.env["ENVIRONMENT_ID"];

          const digest = createHash("sha256")
            .update(`${environmentId}-${this.node.path}`)
            .digest("hex")
            .slice(0, 16);

          return `https://${digest}.wingcloud.io`;
        }
      }

      return new CustomApi(scope, id, props);
    } else if (type === REACT_APP_FQN) {
      class CustomReactApp extends ReactApp {
        get _websiteHost() {
          return this._host ?? { url: `http://127.0.0.1:${this._localPort}` };
        }
      }

      return new CustomReactApp(
        scope,
        id,
        Object.assign({}, props, {
          useBuildCommand: true,
        }),
      );
    }
  }
};
