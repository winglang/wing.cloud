bring cloud;
bring http;
bring ex;
bring util;
bring "../../nanoid/src/nanoid.w" as nanoid;
bring "./types.w" as types;

pub struct FlyContainersProps {
  token: str;
  orgSlug: str;
  region: str?;
}

pub class FlyContainers impl types.IContainers {
  token: str;
  orgSlug: str;
  region: str?;
  graphqlURL: str;
  apiURL: str;

  containers: ex.Table?;

  new(props: FlyContainersProps) {
    this.token = props.token;
    this.orgSlug = props.orgSlug;
    this.region = props.region;
    this.graphqlURL = "https://api.fly.io/graphql";
    this.apiURL = "https://api.machines.dev/v1";

    if util.env("WING_TARGET") == "sim" {
      this.containers = new ex.Table(
        name: "containers",
        primaryKey: "containerID",
        columns: {
          "containerID": ex.ColumnType.STRING,
        },
      );

      new cloud.Service(inflight () => {
        return () => {
          for container in this.containers?.list() ?? [] {
            let containerID = types.ContainerID {
              value: container.get("containerID").asStr(),
            };
            this.destroy(containerID);
          }
        };
      });
    }
  }

  pub inflight create(options: types.CreateContainerOptions): types.Container {
    let containerID = types.ContainerID {
      // Fly app names may only contain numbers, lowercase letters and dashes.
      value: nanoid.Nanoid.nanoid36(),
    };

    let response = http.post(
      "${this.apiURL}/apps",
      headers: {
        "Authorization" => "Bearer ${this.token}",
        "Content-Type" => "application/json",
      },
      body: Json.stringify({
        app_name: containerID.value,
        org_slug: this.orgSlug,
      }),
    );

    // Create a shared IPv4 address for the container.
    http.post(
      this.graphqlURL,
      headers: {
        "Authorization" => "Bearer ${this.token}",
        "Content-Type" => "application/json",
      },
      body: Json.stringify({
        query: "mutation(\$input: AllocateIPAddressInput!) { allocateIpAddress(input: \$input) { ipAddress { id address type region createdAt } } }",
        variables: {
          input: {
            appId: containerID.value,
            type: "shared_v4",
          },
        },
      }),
    );

    // Create machine.
    let var checks: Json? = nil;
    if let readiness = options.readiness {
      checks = {
        httpget: {
          type: "http",
          port: options.port,
          method: "GET",
          path: options.readiness,
          interval: "5s",
          timeout: "3s",
        },
      };
    }
    http.post(
      "${this.apiURL}/apps/${containerID.value}/machines",
      headers: {
        "Authorization" => "Bearer ${this.token}",
        "Content-Type" => "application/json",
      },
      body: Json.stringify({
        region: this.region,
        config: {
          guest: {
            cpus: 1,
            cpu_kind: "shared",
            memory_mb: 256,
          },
          env: options.env,
          auto_destroy: true,
          image: options.image,
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
              internal_port: options.port,
            },
          ],
          checks: checks,
        },
      }),
    );

    let container = types.Container {
      containerID: containerID,
      url: "https://${containerID.value}.fly.dev",
    };
    this.containers?.insert(container.containerID.value, {
      containerID: containerID.value,
    });
    return container;
  }

  pub inflight destroy(containerID: types.ContainerID): void {
    http.post(
      this.graphqlURL,
      headers: {
        "Authorization" => "Bearer ${this.token}",
        "Content-Type" => "application/json"
      },
      body: Json.stringify({
        query: "mutation Delete(\$input:ID!) { deleteApp(appId: \$input) { organization { id } } }",
        variables: {
          input: containerID.value,
        },
      }),
    );
  }
}
