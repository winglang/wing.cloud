import fetch from 'node-fetch';

export interface IClientCreateMachineProps {
  appName: string;
  imageName: string;
  port: number;
  region?: string;
  memoryMb?: number;
  env?: Record<string, string>;
}

export interface IMachineNode {
  readonly id: string;
  readonly instanceId: string;
  readonly state: string;
}

export interface IAppMachines {
  readonly nodes: IMachineNode[];
  readonly totalCount: number;
}

export interface IApp {
  readonly id: string;
  readonly createdAt: string;
  readonly machines: IAppMachines;
};

export interface IGetAppResultDataApps {
  readonly nodes: IApp[]
  readonly totalCount: number;
};

export interface IGetAppResultData {
  readonly apps: IGetAppResultDataApps;
};

export interface IAppsResult {
  readonly data: IGetAppResultData;
};

export interface ICountResultDataApps {
  readonly totalCount: number;
};

export interface ICountResultData {
  readonly apps: ICountResultDataApps;
};

export interface ICountResult {
  readonly data: ICountResultData;
}

interface IRuntimeCreateMachineResult {
  readonly id: string;
  readonly instance_id: string;
}

export interface ICreateMachineResult {
  readonly id: string;
  readonly instanceId: string;
}

export interface IGetAppResultDataApp {
  readonly app: IApp;
}

export interface IGetAppResult {
  readonly data: IGetAppResultDataApp;
}

export class FlyClient {
  token;
  graphqlUrl = "https://api.fly.io/graphql";
  apiUrl = "https://api.machines.dev/v1";

  /**
   * 
   * @param token Fly.io api token. Optional.
   * By default will use the `FLY_API_TOKEN` env var. 
   */
  constructor(token?: string) {
    if (!token) {
      if (!process.env.FLY_API_TOKEN) {
        throw new Error("environment variable FLY_API_TOKEN not set");
      }
      this.token = process.env.FLY_API_TOKEN;
    } else {
      this.token = token;
    }
  }

  /**
   * @internal
   */
  _headers() {
    return {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json"
    }
  }

  async apps() {
    const appsRespone = await fetch(this.graphqlUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "query":`query getapps {
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
        }`
      })
    });
    if (!appsRespone.ok) {
      throw new Error("failed to get apps");
    }
    const apps = await appsRespone.json() as IAppsResult;
    return apps;
  }

  async appsCount() {
    const countRes = await fetch(this.graphqlUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "query":`query getapps {
          apps {
            totalCount
          }
        }`
      })
    });
    if (!countRes.ok) {
      throw new Error("failed to get app count" + countRes.status);
    }
    const count = await countRes.json() as ICountResult;
    return count.data.apps.totalCount;
  }

  async createApp(appName: string) {
    const appRes = await fetch(`${this.apiUrl}/apps`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "app_name": appName,
        "org_slug": "personal"
      })
    });
    if (!appRes.ok) {
      throw new Error("failed to create app: " + appName);
    }
    console.log(await appRes.text())
  }

  async deleteApp(appName: string) {
    const deleteRes = await fetch(this.graphqlUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "query":`mutation Delete($input:ID!) {
          deleteApp(appId: $input) {
            organization {
              id
            } 
          }
        }`,
        "variables":{
          "input": appName
        }
      })
    });
    if (!deleteRes.ok) {
      throw new Error("failed to delete app " + appName);
    }
  }

  async allocateIpAddress(appName: string) {
    const ipRes = await fetch(this.graphqlUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "query":"mutation($input: AllocateIPAddressInput!) { allocateIpAddress(input: $input) { ipAddress { id address type region createdAt } } }",
        "variables":{"input":{"appId":appName,"type":"shared_v4"}}
      })
    })
    if (!ipRes.ok) {
      throw new Error(`failed to create shared ip: ${appName} + ${await ipRes.text()}`);
    }
  }

  async createMachine({appName, imageName, port, region, memoryMb, env}: IClientCreateMachineProps) {
    const machineRes = await fetch(`${this.apiUrl}/apps/${appName}/machines`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "region": region ?? undefined,
        "config": {
          "guest": {
            "cpus": 1,
            "cpu_kind": "shared",
            "memory_mb": memoryMb ?? 512
          },
          "env": env ?? {},
          "auto_destroy": true,
          "image": imageName,
          "services": [
            {
              "ports": [
                {
                  "port": 443,
                  "handlers": [
                    "tls",
                    "http"
                  ]
                },
                {
                  "port": 80,
                  "handlers": [
                    "http"
                  ]
                }
              ],
              "protocol": "tcp",
              "internal_port": port
            }
          ],
        }
      })
    });
    if (!machineRes.ok) {
      throw new Error("failed to create machine: " + appName);
    }
    const rdata = await machineRes.json() as IRuntimeCreateMachineResult;
    const data: ICreateMachineResult = {
      id: rdata.id,
      instanceId: rdata.instance_id,
    }
    if (!data.id || !data.instanceId) {
      throw new Error("unexpected create machine data: " + JSON.stringify(data));
    }
    return data;
  }

  async deleteMachine(appName: string, id: string) {
    const machineRes = await fetch(`${this.apiUrl}/apps/${appName}/machines/${id}?force=true`, {
      method: "DELETE",
      headers: this._headers(),
    });
    if (!machineRes.ok) {
      throw new Error("failed to delete machine: " + appName);
    }
  }

  async waitForMachineState(appName: string, machineResult: ICreateMachineResult) {
    const waitRes = await fetch(`${this.apiUrl}/apps/${appName}/machines/${machineResult.id}/wait?instance_id=${machineResult.instanceId}`, {
      method: "GET",
      headers: this._headers(),
    });
    if (!waitRes.ok) {
      throw new Error("failed to wait for machine: " + appName + ":" + machineResult.id);
    }
  }

  async getApp(appName: string) {
    const res = await fetch(this.graphqlUrl, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify({
        "query":`query getapp($input:String) {
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
        "variables":{
          "input": appName
        }
      })
    });
    if (!res.ok) {
      throw new Error("failed to get app machines: " + appName);
    }
    const verifyMachineResult = await res.json() as IGetAppResult
    return verifyMachineResult;
  }
}
