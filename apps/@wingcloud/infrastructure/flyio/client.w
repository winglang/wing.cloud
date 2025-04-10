bring http;
bring util;

pub struct File {
  guest_path: str;
  raw_value: str?;
  secret_name: str?;
}

pub struct Mount {
  name: str;
  path: str;
  volume: str;
}

pub struct IClientPageInfo {
  endCursor: str;
  hasNextPage: bool;
}

pub struct IClientCreateMachinePort {
  port: num;
  handlers: Array<str>?;
}

pub struct IClientCreateMachineService {
  ports: Array<IClientCreateMachinePort>;
  protocol: str;
  internal_port: num;
}

pub struct IClientCreateMachineProps {
  appName: str;
  imageName: str;
  services: Array<IClientCreateMachineService>;
  region: str?;
  memoryMb: num?;
  cpu: num?;
  env: Map<str>?;
  files: Array<File>?;
  mounts: Array<Mount>?;
}

pub struct IClientUpdateMachineProps extends IClientCreateMachineProps {
  machineId: str;
}

pub struct IClientCreateVolumeProps {
  appName: str;
  name: str;
  region: str;
  size: num;
}

pub struct IClientVolume {
  id: str;
  name: str;
}

pub struct IMachineNode {
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
  pageInfo: IClientPageInfo;
}

struct IGetOrgAppsResultData {
  organization: IGetAppResultData;
}

struct IGetOrgAppsResult {
  data: IGetOrgAppsResultData;
}

struct IGetAppResultData {
  apps: IGetAppResultDataApps;
}

struct IAppsResult {
  data: IGetAppResultData;
}

struct IAppsCountResultData {
  totalCount: num;
}

struct IAppsCountResult {
  apps: IAppsCountResultData;
}

struct IOrgAppsCountResultData {
  organization: IAppsCountResult;
}

struct IOrgAppsCountResult {
  data: IOrgAppsCountResultData;
}

struct IRuntimeCreateMachineResult {
  id: str;
  instance_id: str;
}

pub struct ICreateMachineResult {
  id: str;
  instanceId: str;
}

struct IGetAppResultDataApp {
  app: IApp;
}

struct IGetAppResult {
  data: IGetAppResultDataApp;
}

struct ClientProps {
  token: str;
  orgSlug: str;
}

pub inflight class Client {
  var token: str;
  var orgSlug: str;
  var graphqlUrl: str;
  var apiUrl: str;

  new(props: ClientProps) {
    this.token = props.token;
    this.orgSlug = props.orgSlug;
    this.graphqlUrl = "https://api.fly.io/graphql";
    this.apiUrl = "https://api.machines.dev/v1";
  }

  /**
   * @internal
   */
  _headers(): Map<str> {
    return {
      "Authorization" => "Bearer {this.token}",
      "Content-Type" => "application/json"
    };
  }

  pub apps(cursor: str?): IGetOrgAppsResult {
    let appsRespone = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapps \{organization(name: \"{this.orgSlug}\") \{ apps(after: \"{cursor}\") \{ nodes\{ id machines \{ nodes \{ id instanceId state } totalCount } createdAt } pageInfo \{ endCursor hasNextPage } totalCount } } }",
    }));
    if (!appsRespone.ok) {
      throw "failed to get apps {appsRespone.body}";
    }
    return IGetOrgAppsResult.fromJson(this.verifyJsonResponse(Json.parse(appsRespone.body)));
  }

  pub appsCount(): num {
    let countRes = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapps \{organization(name: \"{this.orgSlug}\") \{ apps \{ totalCount } } }",
    }));
    if (!countRes.ok) {
      throw "failed to get app count {countRes.body}";
    }

    let count = IOrgAppsCountResult.fromJson(this.verifyJsonResponse(Json.parse(countRes.body)));
    return count.data.organization.apps.totalCount;
  }

  pub createApp(appName: str) {
    let appRes = http.post("{this.apiUrl}/apps", headers: this._headers(), body: Json.stringify({
      app_name: appName,
      org_slug: this.orgSlug,
    }));
    if (!appRes.ok) {
      throw "failed to create app {appName}: {appRes.body}" + appName;
    }
  }

  pub deleteApp(appName: str) {
    let deleteRes = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "mutation Delete($input:ID!) \{ deleteApp(appId: $input) \{ organization \{ id } } }",
      variables: {
        input: appName,
      },
    }));
    if (!deleteRes.ok) {
      throw "failed to delete app {appName}: {deleteRes.body}";
    }
  }

  pub allocateIpAddress(appName: str) {
    let ipRes = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "mutation($input: AllocateIPAddressInput!) \{ allocateIpAddress(input: $input) \{ ipAddress \{ id address type region createdAt } } }",
        variables: { input: { appId: appName, type: "v4" } },
    }));
    if (!ipRes.ok) {
      throw "failed to create shared ip: {appName} + {ipRes.body}";
    }
  }

  pub createMachine(props: IClientCreateMachineProps): ICreateMachineResult {
    let machineRes = http.post(
      "{this.apiUrl}/apps/{props.appName}/machines",
      headers: this._headers(),
      body: Json.stringify(this.machineConfigFromProps(props))
    );
    if (!machineRes.ok) {
      throw "failed to create machine {props.appName}: {machineRes.body}";
    }

    let rdata = IRuntimeCreateMachineResult.fromJson(this.verifyJsonResponse(Json.parse(machineRes.body)));
    let data: ICreateMachineResult = {
      id: rdata.id,
      instanceId: rdata.instance_id,
    };
    if (data.id == "" || data.instanceId == "") {
      throw "unexpected create machine data: {data}";
    }
    return data;
  }

  pub updateMachine(props: IClientUpdateMachineProps): ICreateMachineResult {
    let machineRes = http.post(
      "{this.apiUrl}/apps/{props.appName}/machines/{props.machineId}",
      headers: this._headers(),
      body: Json.stringify(this.machineConfigFromProps(props))
    );
    if (!machineRes.ok) {
      throw "failed to update machine {props.appName}: {machineRes.body}";
    }

    let rdata = IRuntimeCreateMachineResult.fromJson(this.verifyJsonResponse(Json.parse(machineRes.body)));
    let data: ICreateMachineResult = {
      id: rdata.id,
      instanceId: rdata.instance_id,
    };
    if (data.id == "" || data.instanceId == "") {
      throw "unexpected update machine data: {data}";
    }
    return data;
  }

  machineConfigFromProps(props: IClientCreateMachineProps): Json {
    return {
      region: props.region,
      config: {
        guest: {
          cpus: props.cpu ?? 1,
          cpu_kind: "shared",
          memory_mb: props.memoryMb ?? 512,
        },
        restart: {
          policy: "no",
        },
        mounts: props.mounts ?? [],
        env: props.env ?? {},
        files: props.files ?? [],
        image: props.imageName,
        services: props.services,
      },
    };
  }

  pub deleteMachine(appName: str, id: str) {
    let machineRes = http.delete("{this.apiUrl}/apps/{appName}/machines/{id}?force=true", headers: this._headers());
    if (!machineRes.ok) {
      throw "failed to delete machine {appName}: {machineRes.body}";
    }
  }

  pub waitForMachineState(
    appName: str,
    machineResult: ICreateMachineResult,
  ) {
    let waitRes = http.get("{this.apiUrl}/apps/{appName}/machines/{machineResult.id}/wait?instance_id={machineResult.instanceId}", headers: this._headers());
    if (!waitRes.ok) {
      throw "failed to wait for machine {appName} {machineResult.id}: {waitRes.body}";
    }
  }

  pub createVolume(props: IClientCreateVolumeProps): IClientVolume {
    let volumeRes = http.post("{this.apiUrl}/apps/{props.appName}/volumes", headers: this._headers(), body: Json.stringify({
      name: props.name,
      region: props.region,
      size_gb: props.size,
    }));
    if (!volumeRes.ok) {
      throw "failed to create volume for app {props.appName}: {volumeRes.body}";
    }
    let volume = IClientVolume.fromJson(this.verifyJsonResponse(Json.parse(volumeRes.body)));
    return volume;
  }

  pub listVolumes(appName: str): Array<IClientVolume> {
    let volumesRes = http.get("{this.apiUrl}/apps/{appName}/volumes", headers: this._headers());
    if (!volumesRes.ok) {
      throw "failed to list volumes for app {appName}: {volumesRes.body}";
    }
    
    let volumes: Array<IClientVolume> = unsafeCast(this.verifyJsonResponse(Json.parse(volumesRes.body)));
    return volumes;
  }

  pub getApp(appName: str): IGetAppResult {
    let res = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapp($input:String) \{ app(name: $input) \{ id machines \{ nodes \{ id instanceId state } totalCount } createdAt } }",
      variables: {
        input: appName,
      },
    }));
    if (!res.ok) {
      throw "failed to get app {appName}: {res.body}";
    }

    return IGetAppResult.fromJson(this.verifyJsonResponse(Json.parse(res.body)));
  }

  pub isAppExists(appName: str): bool {
    let res = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "query getapp($input:String) \{ app(name: $input) \{ id machines \{ nodes \{ id instanceId state } totalCount } createdAt } }",
      variables: {
        input: appName,
      },
    }));
    if (!res.ok) {
      throw "failed to check if app existts {appName}: {res.body}";
    }

    let notFoundError = this.checkForNotFoundError(Json.parse(res.body));
    return !notFoundError;
  }

  pub createSecrets(appName: str, secrets: Map<str>) {
    let secretsArray = MutArray<Json>[];
    for secret in secrets.keys() {
      secretsArray.push({
        key: secret,
        value: secrets.get(secret)
      });
    }

    let res = http.post(this.graphqlUrl, headers: this._headers(), body: Json.stringify({
      query: "mutation Secrets($input: SetSecretsInput!) \{ setSecrets(input: $input) \{ app \{ id } } }",
      variables: {
        "input": {
          "appId": "{appName}",
          "secrets": secretsArray.copy()
        }
      },
    }));

    if (!res.ok) {
      throw "failed to create secrets {appName}: {res.body}";
    }
  }

  verifyJsonResponse(response: Json): Json {
    if let errors = response.tryGet("errors") {
      throw "respone with errors: {errors}";
    }

    return response;
  }

  checkForNotFoundError(response: Json): bool {
    if let errors = response.tryGet("errors") {
      if let code = errors.tryGetAt(0)?.tryGet("extensions")?.tryGet("code")?.tryAsStr() {
        if code == "NOT_FOUND" {
          return true;
        }
      }
      throw "checkForNotFoundError: unexpected error {errors}";
    } else {
      return false;
    }
  }
}
