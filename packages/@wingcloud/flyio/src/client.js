"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlyClient = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const node_fetch_1 = require("node-fetch");
class FlyClient {
    /**
     *
     * @param token Fly.io api token. Optional.
     * By default will use the `FLY_API_TOKEN` env var.
     */
    constructor(token) {
        this.graphqlUrl = "https://api.fly.io/graphql";
        this.apiUrl = "https://api.machines.dev/v1";
        if (token) {
            this.token = token;
        }
        else {
            const envToken = process.env["FLY_API_TOKEN"];
            if (!envToken) {
                throw new Error("environment variable FLY_API_TOKEN not set");
            }
            this.token = envToken;
        }
    }
    /**
     * @internal
     */
    _headers() {
        return {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
        };
    }
    async apps() {
        const appsRespone = await (0, node_fetch_1.default)(this.graphqlUrl, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                query: `query getapps {
          apps {
            nodes{
              id
              machines {
                nodes {
                  id
                  instanceId
                  state
                }
                totalCount
              }
              createdAt
            }
            totalCount
          }
        }`,
            }),
        });
        if (!appsRespone.ok) {
            throw new Error("failed to get apps");
        }
        const apps = (await appsRespone.json());
        return apps;
    }
    async appsCount() {
        const countRes = await (0, node_fetch_1.default)(this.graphqlUrl, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                query: `query getapps {
          apps {
            totalCount
          }
        }`,
            }),
        });
        if (!countRes.ok) {
            throw new Error("failed to get app count" + countRes.status);
        }
        const count = (await countRes.json());
        return count.data.apps.totalCount;
    }
    async createApp(appName) {
        const appRes = await (0, node_fetch_1.default)(`${this.apiUrl}/apps`, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                app_name: appName,
                org_slug: "personal",
            }),
        });
        if (!appRes.ok) {
            throw new Error("failed to create app: " + appName);
        }
        console.log(await appRes.text());
    }
    async deleteApp(appName) {
        const deleteRes = await (0, node_fetch_1.default)(this.graphqlUrl, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                query: `mutation Delete($input:ID!) {
          deleteApp(appId: $input) {
            organization {
              id
            }
          }
        }`,
                variables: {
                    input: appName,
                },
            }),
        });
        if (!deleteRes.ok) {
            throw new Error("failed to delete app " + appName);
        }
    }
    async allocateIpAddress(appName) {
        const ipRes = await (0, node_fetch_1.default)(this.graphqlUrl, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                query: "mutation($input: AllocateIPAddressInput!) { allocateIpAddress(input: $input) { ipAddress { id address type region createdAt } } }",
                variables: { input: { appId: appName, type: "shared_v4" } },
            }),
        });
        if (!ipRes.ok) {
            throw new Error(`failed to create shared ip: ${appName} + ${await ipRes.text()}`);
        }
    }
    async createMachine({ appName, imageName, port, region, memoryMb, env, }) {
        const machineRes = await (0, node_fetch_1.default)(`${this.apiUrl}/apps/${appName}/machines`, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                region: region ?? undefined,
                config: {
                    guest: {
                        cpus: 1,
                        cpu_kind: "shared",
                        memory_mb: memoryMb ?? 512,
                    },
                    env: env ?? {},
                    auto_destroy: true,
                    image: imageName,
                    services: [
                        {
                            ports: [
                                {
                                    port: 443,
                                    handlers: ["tls", "http"],
                                },
                                {
                                    port: 80,
                                    handlers: ["http"],
                                },
                            ],
                            protocol: "tcp",
                            internal_port: port,
                        },
                    ],
                },
            }),
        });
        if (!machineRes.ok) {
            throw new Error("failed to create machine: " + appName);
        }
        const rdata = (await machineRes.json());
        const data = {
            id: rdata.id,
            instanceId: rdata.instance_id,
        };
        if (!data.id || !data.instanceId) {
            throw new Error("unexpected create machine data: " + JSON.stringify(data));
        }
        return data;
    }
    async deleteMachine(appName, id) {
        const machineRes = await (0, node_fetch_1.default)(`${this.apiUrl}/apps/${appName}/machines/${id}?force=true`, {
            method: "DELETE",
            headers: this._headers(),
        });
        if (!machineRes.ok) {
            throw new Error("failed to delete machine: " + appName);
        }
    }
    async waitForMachineState(appName, machineResult) {
        const waitRes = await (0, node_fetch_1.default)(`${this.apiUrl}/apps/${appName}/machines/${machineResult.id}/wait?instance_id=${machineResult.instanceId}`, {
            method: "GET",
            headers: this._headers(),
        });
        if (!waitRes.ok) {
            throw new Error("failed to wait for machine: " + appName + ":" + machineResult.id);
        }
    }
    async getApp(appName) {
        const res = await (0, node_fetch_1.default)(this.graphqlUrl, {
            method: "POST",
            headers: this._headers(),
            body: JSON.stringify({
                query: `query getapp($input:String) {
          app(name:$input) {
            id
            machines {
              nodes {
                id
                instanceId
                state
              }
              totalCount
            }
            createdAt
          }
        }`,
                variables: {
                    input: appName,
                },
            }),
        });
        if (!res.ok) {
            throw new Error("failed to get app machines: " + appName);
        }
        const verifyMachineResult = (await res.json());
        return verifyMachineResult;
    }
}
exports.FlyClient = FlyClient;
_a = JSII_RTTI_SYMBOL_1;
FlyClient[_a] = { fqn: "@wingcloud/flyio.FlyClient", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMkNBQStCO0FBdUUvQixNQUFhLFNBQVM7SUFLcEI7Ozs7T0FJRztJQUNILFlBQVksS0FBYztRQVIxQixlQUFVLEdBQUcsNEJBQTRCLENBQUM7UUFDMUMsV0FBTSxHQUFHLDZCQUE2QixDQUFDO1FBUXJDLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDcEI7YUFBTTtZQUNMLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7YUFDL0Q7WUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztTQUN2QjtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixPQUFPO1lBQ0wsYUFBYSxFQUFFLFVBQVUsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNyQyxjQUFjLEVBQUUsa0JBQWtCO1NBQ25DLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxDQUFDLElBQUk7UUFDUixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsb0JBQUssRUFBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQy9DLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDeEIsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLEtBQUssRUFBRTs7Ozs7Ozs7Ozs7Ozs7OztVQWdCTDthQUNILENBQUM7U0FDSCxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRTtZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDdkM7UUFD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QUFHLE9BQU8sR0FBRyxHQUFHLEdBQUcsYUFBYSxDQUFDLEVBQUUsQ0FDbEUsQ0FBQztTQUNIO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBZTtRQUMxQixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsb0JBQUssRUFBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3ZDLE1BQU0sRUFBRSxNQUFNO1lBQ2QsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDeEIsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLEtBQUssRUFBRTs7Ozs7Ozs7Ozs7OztVQWFMO2dCQUNGLFNBQVMsRUFBRTtvQkFDVCxLQUFLLEVBQUUsT0FBTztpQkFDZjthQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtZQUNYLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLEdBQUcsT0FBTyxDQUFDLENBQUM7U0FDM0Q7UUFDRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQWtCLENBQUM7UUFDaEUsT0FBTyxtQkFBbUIsQ0FBQztJQUM3QixDQUFDOztBQTdQSCw4QkE4UEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmV0Y2ggZnJvbSBcIm5vZGUtZmV0Y2hcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJQ2xpZW50Q3JlYXRlTWFjaGluZVByb3BzIHtcbiAgYXBwTmFtZTogc3RyaW5nO1xuICBpbWFnZU5hbWU6IHN0cmluZztcbiAgcG9ydDogbnVtYmVyO1xuICByZWdpb24/OiBzdHJpbmc7XG4gIG1lbW9yeU1iPzogbnVtYmVyO1xuICBlbnY/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElNYWNoaW5lTm9kZSB7XG4gIHJlYWRvbmx5IGlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGluc3RhbmNlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgc3RhdGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXBwTWFjaGluZXMge1xuICByZWFkb25seSBub2RlczogSU1hY2hpbmVOb2RlW107XG4gIHJlYWRvbmx5IHRvdGFsQ291bnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXBwIHtcbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY3JlYXRlZEF0OiBzdHJpbmc7XG4gIHJlYWRvbmx5IG1hY2hpbmVzOiBJQXBwTWFjaGluZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUdldEFwcFJlc3VsdERhdGFBcHBzIHtcbiAgcmVhZG9ubHkgbm9kZXM6IElBcHBbXTtcbiAgcmVhZG9ubHkgdG90YWxDb3VudDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHZXRBcHBSZXN1bHREYXRhIHtcbiAgcmVhZG9ubHkgYXBwczogSUdldEFwcFJlc3VsdERhdGFBcHBzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBcHBzUmVzdWx0IHtcbiAgcmVhZG9ubHkgZGF0YTogSUdldEFwcFJlc3VsdERhdGE7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvdW50UmVzdWx0RGF0YUFwcHMge1xuICByZWFkb25seSB0b3RhbENvdW50OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNvdW50UmVzdWx0RGF0YSB7XG4gIHJlYWRvbmx5IGFwcHM6IElDb3VudFJlc3VsdERhdGFBcHBzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDb3VudFJlc3VsdCB7XG4gIHJlYWRvbmx5IGRhdGE6IElDb3VudFJlc3VsdERhdGE7XG59XG5cbmludGVyZmFjZSBJUnVudGltZUNyZWF0ZU1hY2hpbmVSZXN1bHQge1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuICByZWFkb25seSBpbnN0YW5jZV9pZDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDcmVhdGVNYWNoaW5lUmVzdWx0IHtcbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgaW5zdGFuY2VJZDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHZXRBcHBSZXN1bHREYXRhQXBwIHtcbiAgcmVhZG9ubHkgYXBwOiBJQXBwO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElHZXRBcHBSZXN1bHQge1xuICByZWFkb25seSBkYXRhOiBJR2V0QXBwUmVzdWx0RGF0YUFwcDtcbn1cblxuZXhwb3J0IGNsYXNzIEZseUNsaWVudCB7XG4gIHRva2VuO1xuICBncmFwaHFsVXJsID0gXCJodHRwczovL2FwaS5mbHkuaW8vZ3JhcGhxbFwiO1xuICBhcGlVcmwgPSBcImh0dHBzOi8vYXBpLm1hY2hpbmVzLmRldi92MVwiO1xuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gdG9rZW4gRmx5LmlvIGFwaSB0b2tlbi4gT3B0aW9uYWwuXG4gICAqIEJ5IGRlZmF1bHQgd2lsbCB1c2UgdGhlIGBGTFlfQVBJX1RPS0VOYCBlbnYgdmFyLlxuICAgKi9cbiAgY29uc3RydWN0b3IodG9rZW4/OiBzdHJpbmcpIHtcbiAgICBpZiAodG9rZW4pIHtcbiAgICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZW52VG9rZW4gPSBwcm9jZXNzLmVudltcIkZMWV9BUElfVE9LRU5cIl07XG4gICAgICBpZiAoIWVudlRva2VuKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImVudmlyb25tZW50IHZhcmlhYmxlIEZMWV9BUElfVE9LRU4gbm90IHNldFwiKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudG9rZW4gPSBlbnZUb2tlbjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfaGVhZGVycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3RoaXMudG9rZW59YCxcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBhcHBzKCkge1xuICAgIGNvbnN0IGFwcHNSZXNwb25lID0gYXdhaXQgZmV0Y2godGhpcy5ncmFwaHFsVXJsLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczogdGhpcy5faGVhZGVycygpLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBxdWVyeTogYHF1ZXJ5IGdldGFwcHMge1xuICAgICAgICAgIGFwcHMge1xuICAgICAgICAgICAgbm9kZXN7XG4gICAgICAgICAgICAgIGlkXG4gICAgICAgICAgICAgIG1hY2hpbmVzIHtcbiAgICAgICAgICAgICAgICBub2RlcyB7XG4gICAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgICAgaW5zdGFuY2VJZFxuICAgICAgICAgICAgICAgICAgc3RhdGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdG90YWxDb3VudFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG90YWxDb3VudFxuICAgICAgICAgIH1cbiAgICAgICAgfWAsXG4gICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAoIWFwcHNSZXNwb25lLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsZWQgdG8gZ2V0IGFwcHNcIik7XG4gICAgfVxuICAgIGNvbnN0IGFwcHMgPSAoYXdhaXQgYXBwc1Jlc3BvbmUuanNvbigpKSBhcyBJQXBwc1Jlc3VsdDtcbiAgICByZXR1cm4gYXBwcztcbiAgfVxuXG4gIGFzeW5jIGFwcHNDb3VudCgpIHtcbiAgICBjb25zdCBjb3VudFJlcyA9IGF3YWl0IGZldGNoKHRoaXMuZ3JhcGhxbFVybCwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHRoaXMuX2hlYWRlcnMoKSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgcXVlcnk6IGBxdWVyeSBnZXRhcHBzIHtcbiAgICAgICAgICBhcHBzIHtcbiAgICAgICAgICAgIHRvdGFsQ291bnRcbiAgICAgICAgICB9XG4gICAgICAgIH1gLFxuICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKCFjb3VudFJlcy5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZmFpbGVkIHRvIGdldCBhcHAgY291bnRcIiArIGNvdW50UmVzLnN0YXR1cyk7XG4gICAgfVxuICAgIGNvbnN0IGNvdW50ID0gKGF3YWl0IGNvdW50UmVzLmpzb24oKSkgYXMgSUNvdW50UmVzdWx0O1xuICAgIHJldHVybiBjb3VudC5kYXRhLmFwcHMudG90YWxDb3VudDtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUFwcChhcHBOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhcHBSZXMgPSBhd2FpdCBmZXRjaChgJHt0aGlzLmFwaVVybH0vYXBwc2AsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB0aGlzLl9oZWFkZXJzKCksXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGFwcF9uYW1lOiBhcHBOYW1lLFxuICAgICAgICBvcmdfc2x1ZzogXCJwZXJzb25hbFwiLFxuICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKCFhcHBSZXMub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImZhaWxlZCB0byBjcmVhdGUgYXBwOiBcIiArIGFwcE5hbWUpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhhd2FpdCBhcHBSZXMudGV4dCgpKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZUFwcChhcHBOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBkZWxldGVSZXMgPSBhd2FpdCBmZXRjaCh0aGlzLmdyYXBocWxVcmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB0aGlzLl9oZWFkZXJzKCksXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHF1ZXJ5OiBgbXV0YXRpb24gRGVsZXRlKCRpbnB1dDpJRCEpIHtcbiAgICAgICAgICBkZWxldGVBcHAoYXBwSWQ6ICRpbnB1dCkge1xuICAgICAgICAgICAgb3JnYW5pemF0aW9uIHtcbiAgICAgICAgICAgICAgaWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1gLFxuICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICBpbnB1dDogYXBwTmFtZSxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIH0pO1xuICAgIGlmICghZGVsZXRlUmVzLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsZWQgdG8gZGVsZXRlIGFwcCBcIiArIGFwcE5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGFsbG9jYXRlSXBBZGRyZXNzKGFwcE5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGlwUmVzID0gYXdhaXQgZmV0Y2godGhpcy5ncmFwaHFsVXJsLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczogdGhpcy5faGVhZGVycygpLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBxdWVyeTpcbiAgICAgICAgICBcIm11dGF0aW9uKCRpbnB1dDogQWxsb2NhdGVJUEFkZHJlc3NJbnB1dCEpIHsgYWxsb2NhdGVJcEFkZHJlc3MoaW5wdXQ6ICRpbnB1dCkgeyBpcEFkZHJlc3MgeyBpZCBhZGRyZXNzIHR5cGUgcmVnaW9uIGNyZWF0ZWRBdCB9IH0gfVwiLFxuICAgICAgICB2YXJpYWJsZXM6IHsgaW5wdXQ6IHsgYXBwSWQ6IGFwcE5hbWUsIHR5cGU6IFwic2hhcmVkX3Y0XCIgfSB9LFxuICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKCFpcFJlcy5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgZmFpbGVkIHRvIGNyZWF0ZSBzaGFyZWQgaXA6ICR7YXBwTmFtZX0gKyAke2F3YWl0IGlwUmVzLnRleHQoKX1gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVNYWNoaW5lKHtcbiAgICBhcHBOYW1lLFxuICAgIGltYWdlTmFtZSxcbiAgICBwb3J0LFxuICAgIHJlZ2lvbixcbiAgICBtZW1vcnlNYixcbiAgICBlbnYsXG4gIH06IElDbGllbnRDcmVhdGVNYWNoaW5lUHJvcHMpIHtcbiAgICBjb25zdCBtYWNoaW5lUmVzID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5hcGlVcmx9L2FwcHMvJHthcHBOYW1lfS9tYWNoaW5lc2AsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB0aGlzLl9oZWFkZXJzKCksXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHJlZ2lvbjogcmVnaW9uID8/IHVuZGVmaW5lZCxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgZ3Vlc3Q6IHtcbiAgICAgICAgICAgIGNwdXM6IDEsXG4gICAgICAgICAgICBjcHVfa2luZDogXCJzaGFyZWRcIixcbiAgICAgICAgICAgIG1lbW9yeV9tYjogbWVtb3J5TWIgPz8gNTEyLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZW52OiBlbnYgPz8ge30sXG4gICAgICAgICAgYXV0b19kZXN0cm95OiB0cnVlLFxuICAgICAgICAgIGltYWdlOiBpbWFnZU5hbWUsXG4gICAgICAgICAgc2VydmljZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcG9ydHM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBwb3J0OiA0NDMsXG4gICAgICAgICAgICAgICAgICBoYW5kbGVyczogW1widGxzXCIsIFwiaHR0cFwiXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHBvcnQ6IDgwLFxuICAgICAgICAgICAgICAgICAgaGFuZGxlcnM6IFtcImh0dHBcIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgcHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICAgIGludGVybmFsX3BvcnQ6IHBvcnQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAoIW1hY2hpbmVSZXMub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImZhaWxlZCB0byBjcmVhdGUgbWFjaGluZTogXCIgKyBhcHBOYW1lKTtcbiAgICB9XG4gICAgY29uc3QgcmRhdGEgPSAoYXdhaXQgbWFjaGluZVJlcy5qc29uKCkpIGFzIElSdW50aW1lQ3JlYXRlTWFjaGluZVJlc3VsdDtcbiAgICBjb25zdCBkYXRhOiBJQ3JlYXRlTWFjaGluZVJlc3VsdCA9IHtcbiAgICAgIGlkOiByZGF0YS5pZCxcbiAgICAgIGluc3RhbmNlSWQ6IHJkYXRhLmluc3RhbmNlX2lkLFxuICAgIH07XG4gICAgaWYgKCFkYXRhLmlkIHx8ICFkYXRhLmluc3RhbmNlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJ1bmV4cGVjdGVkIGNyZWF0ZSBtYWNoaW5lIGRhdGE6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZU1hY2hpbmUoYXBwTmFtZTogc3RyaW5nLCBpZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbWFjaGluZVJlcyA9IGF3YWl0IGZldGNoKFxuICAgICAgYCR7dGhpcy5hcGlVcmx9L2FwcHMvJHthcHBOYW1lfS9tYWNoaW5lcy8ke2lkfT9mb3JjZT10cnVlYCxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiBcIkRFTEVURVwiLFxuICAgICAgICBoZWFkZXJzOiB0aGlzLl9oZWFkZXJzKCksXG4gICAgICB9LFxuICAgICk7XG4gICAgaWYgKCFtYWNoaW5lUmVzLm9rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJmYWlsZWQgdG8gZGVsZXRlIG1hY2hpbmU6IFwiICsgYXBwTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgd2FpdEZvck1hY2hpbmVTdGF0ZShcbiAgICBhcHBOYW1lOiBzdHJpbmcsXG4gICAgbWFjaGluZVJlc3VsdDogSUNyZWF0ZU1hY2hpbmVSZXN1bHQsXG4gICkge1xuICAgIGNvbnN0IHdhaXRSZXMgPSBhd2FpdCBmZXRjaChcbiAgICAgIGAke3RoaXMuYXBpVXJsfS9hcHBzLyR7YXBwTmFtZX0vbWFjaGluZXMvJHttYWNoaW5lUmVzdWx0LmlkfS93YWl0P2luc3RhbmNlX2lkPSR7bWFjaGluZVJlc3VsdC5pbnN0YW5jZUlkfWAsXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgaGVhZGVyczogdGhpcy5faGVhZGVycygpLFxuICAgICAgfSxcbiAgICApO1xuICAgIGlmICghd2FpdFJlcy5vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcImZhaWxlZCB0byB3YWl0IGZvciBtYWNoaW5lOiBcIiArIGFwcE5hbWUgKyBcIjpcIiArIG1hY2hpbmVSZXN1bHQuaWQsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldEFwcChhcHBOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh0aGlzLmdyYXBocWxVcmwsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB0aGlzLl9oZWFkZXJzKCksXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHF1ZXJ5OiBgcXVlcnkgZ2V0YXBwKCRpbnB1dDpTdHJpbmcpIHtcbiAgICAgICAgICBhcHAobmFtZTokaW5wdXQpIHtcbiAgICAgICAgICAgIGlkXG4gICAgICAgICAgICBtYWNoaW5lcyB7XG4gICAgICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgIGluc3RhbmNlSWRcbiAgICAgICAgICAgICAgICBzdGF0ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRvdGFsQ291bnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICAgIH1cbiAgICAgICAgfWAsXG4gICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgIGlucHV0OiBhcHBOYW1lLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImZhaWxlZCB0byBnZXQgYXBwIG1hY2hpbmVzOiBcIiArIGFwcE5hbWUpO1xuICAgIH1cbiAgICBjb25zdCB2ZXJpZnlNYWNoaW5lUmVzdWx0ID0gKGF3YWl0IHJlcy5qc29uKCkpIGFzIElHZXRBcHBSZXN1bHQ7XG4gICAgcmV0dXJuIHZlcmlmeU1hY2hpbmVSZXN1bHQ7XG4gIH1cbn1cbiJdfQ==