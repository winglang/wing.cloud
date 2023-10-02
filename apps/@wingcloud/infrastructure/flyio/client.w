bring http;
bring util;

struct IClientCreateMachineProps {
  appName: str;
  imageName: str;
  port: num;
  region: str?;
  memoryMb: num?;
  env: Map<str>?;
}

struct IMachineNode {
  id: str;
  instanceId: str;
  state: str;
}

struct IAppMachines {
  nodes: Array<IMachineNode>;
  totalCount: num;
}

struct IApp {
  id: str;
  createdAt: str;
  machines: IAppMachines;
}

struct IGetAppResultDataApps {
  nodes: Array<IApp>;
  totalCount: num;
}

struct IGetAppResultData {
  apps: IGetAppResultDataApps;
}

struct IAppsResult {
  data: IGetAppResultData;
}

struct ICountResultDataApps {
  totalCount: num;
}

struct ICountResultData {
  apps: ICountResultDataApps;
}

struct ICountResult {
  data: ICountResultData;
}

struct IRuntimeCreateMachineResult {
  id: str;
  instance_id: str;
}

struct ICreateMachineResult {
  id: str;
  instanceId: str;
}

struct IGetAppResultDataApp {
  app: IApp;
}

struct IGetAppResult {
  data: IGetAppResultDataApp;
}

inflight class Client {
  var token: str;
  var graphqlUrl: str = "https://api.fly.io/graphql";
  var apiUrl: str = "https://api.machines.dev/v1";

  /**
   *
   * @param token Fly.io api token. Optional.
   * By default will use the `FLY_API_TOKEN` env var.
   */

  // use _init because cannt call functions in inflight init
  // TODO: https://github.com/winglang/wing/issues/4290
  init(token: str?) {
    this.token = "";
    this.graphqlUrl = "";
    this.apiUrl = "";
  }

  pub _init(token: str?) {
    if let t = token {
      this.token = t;
    } else {
      if let envToken = util.tryEnv("FLY_API_TOKEN") {
        this.token = envToken;
      } else {
        throw "environment variable FLY_API_TOKEN not set";
      }
    }

    this.graphqlUrl = "https://api.fly.io/graphql";
    this.apiUrl = "https://api.machines.dev/v1";
  }

  /**
   * @internal
   */
  _headers(): Map<str> {
    return {
      "Authorization" => "Bearer ${this.token}",
      "Content-Type" => "application/json"
    };
  }

  pub apps(): IAppsResult {
    let appsRespone = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapps { apps { nodes{ id machines { nodes { id instanceId state } totalCount } createdAt } totalCount } }",
    }));
    if (!appsRespone.ok) {
      throw "failed to get apps ${appsRespone.body}";
    }

    return IAppsResult.fromJson(Json appsRespone.body);
  }

  pub appsCount(): num {
    let countRes = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapps { apps { totalCount } }",
    }));
    if (!countRes.ok) {
      throw "failed to get app count ${countRes.body}";
    }

    let count = ICountResult.fromJson(Json countRes.body);
    return count.data.apps.totalCount;
  }

  pub createApp(appName: str) {
    let appRes = http.post("${this.apiUrl}/apps", headers: this._headers(), body: Json.stringify({
      app_name: appName,
      org_slug: "personal",
    }));
    if (!appRes.ok) {
      throw "failed to create app ${appName}: ${appRes.body}" + appName;
    }
  }

  pub deleteApp(appName: str) {
    let deleteRes = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "mutation Delete(\$input:ID!) { deleteApp(appId: \$input) { organization { id } } }",
      variables: {
        input: appName,
      },
    }));
    if (!deleteRes.ok) {
      throw "failed to delete app ${appName}: ${deleteRes.body}";
    }
  }

  pub allocateIpAddress(appName: str) {
    let ipRes = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "mutation(\$input: AllocateIPAddressInput!) { allocateIpAddress(input: \$input) { ipAddress { id address type region createdAt } } }",
        variables: { input: { appId: appName, type: "shared_v4" } },
    }));
    if (!ipRes.ok) {
      throw "failed to create shared ip: ${appName} + ${ipRes.body}";
    }
  }

  pub createMachine(props: IClientCreateMachineProps): ICreateMachineResult {
    let machineRes = http.post("${this.apiUrl}/apps/${props.appName}/machines", headers: this._headers(), body: Json.stringify({
      region: props.region,
      config: {
        guest: {
          cpus: 1,
          cpu_kind: "shared",
          memory_mb: props.memoryMb ?? 512,
        },
        env: props.env ?? {},
        auto_destroy: true,
        image: props.imageName,
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
            internal_port: props.port,
          },
        ],
      },
    }));
    if (!machineRes.ok) {
      throw "failed to create machine ${props.appName}: ${machineRes.body}";
    }

    let rdata = IRuntimeCreateMachineResult.fromJson(machineRes.body);
    let data: ICreateMachineResult = {
      id: rdata.id,
      instanceId: rdata.instance_id,
    };
    if (data.id == "" || data.instanceId == "") {
      throw "unexpected create machine data: ${data}";
    }
    return data;
  }

  pub deleteMachine(appName: str, id: str) {
    let machineRes = http.delete("${this.apiUrl}/apps/${appName}/machines/${id}?force=true", headers: this._headers());
    if (!machineRes.ok) {
      throw "failed to delete machine ${appName}: ${machineRes.body}";
    }
  }

  pub waitForMachineState(
    appName: str,
    machineResult: ICreateMachineResult,
  ) {
    let waitRes = http.get("${this.apiUrl}/apps/${appName}/machines/${machineResult.id}/wait?instance_id=${machineResult.instanceId}", headers: this._headers());
    if (!waitRes.ok) {
      throw "failed to wait for machine ${appName} ${machineResult.id}: ${waitRes.body}";
    }
  }

  pub getApp(appName: str): IGetAppResult {
    let res = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapp(\$input:String) { app(name:\$input) { id machines { nodes { id instanceId state } totalCount } createdAt } }",
      variables: {
        input: appName,
      },
    }));
    if (!res.ok) {
      throw "failed to get app machine ${appName}: ${res.body}";
    }

    return IGetAppResult.fromJson(res.body);
  }
}
