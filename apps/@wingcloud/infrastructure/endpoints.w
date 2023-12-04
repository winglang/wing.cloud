bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./status-reports.w" as status_report;

pub struct Endpoint {
  id: str;
  appId: str;
  environmentId: str;
  path: str;
  type: str;
  localUrl: str;
  publicUrl: str;
  port: num;
  digest: str;
  createdAt: str;
  updatedAt: str;
}

struct Item extends Endpoint {
  pk: str;
  sk: str;
}

pub struct CreateEndpointOptions {
  appId: str;
  environmentId: str;
  path: str;
  type: str;
  localUrl: str;
  publicUrl: str;
  port: num;
  digest: str;
}

struct GetEndpointOptions {
  id: str;
  environmentId: str;
}

struct DeleteEndpointOptions {
  id: str;
  environmentId: str;
}

struct ListEndpointsOptions {
  environmentId: str;
}

struct MakeItemOptions {
  pk: str;
  sk: str;
}

pub class Endpoints {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateEndpointOptions): Endpoint {
    let createdAt = datetime.utcNow().toIso();
    let endpoint = Endpoint {
      id: "endpoint_{nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      environmentId: options.environmentId,
      path: options.path,
      type: options.type,
      localUrl: options.localUrl,
      publicUrl: options.publicUrl,
      port: options.port,
      digest: options.digest,
      createdAt: createdAt,
      updatedAt: createdAt,
    };

    let makeItem = (ops: MakeItemOptions) => {
      let item = MutJson {
        pk: ops.pk,
        sk: ops.sk,
        id: endpoint.id,
        appId: endpoint.appId,
        environmentId: endpoint.environmentId,
        path: endpoint.path,
        type: endpoint.type,
        localUrl: endpoint.localUrl,
        publicUrl: endpoint.publicUrl,
        port: endpoint.port,
        digest: endpoint.digest,
        createdAt: endpoint.createdAt,
        updatedAt: endpoint.createdAt,
      };

      return item;
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: makeItem(pk: "ENVIRONMENT#{endpoint.environmentId}", sk: "ENDPOINT#{endpoint.id}"),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
    ]);

    return endpoint;
  }

  pub inflight get(options: GetEndpointOptions): Endpoint {
    let result = this.table.getItem(
      key: {
        pk: "ENVIRONMENT#{options.environmentId}",
        sk: "ENDPOINT#{options.id}",
      },
    );

    if let item = result.item {
      return this.fromDB(item);
    }

    throw "Endpoint [{options.id}] not found";
  }

  pub inflight delete(options: DeleteEndpointOptions): Endpoint {
    let result = this.table.deleteItem(
      key: {
        pk: "ENVIRONMENT#{options.environmentId}",
        sk: "ENDPOINT#{options.id}",
      },
    );
  }

  pub inflight list(options: ListEndpointsOptions): Array<Endpoint> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "ENVIRONMENT#{options.environmentId}",
        ":sk": "ENDPOINT#",
      },
    );
    let var endpoints: Array<Endpoint> = [];
    for item in result.items {
      endpoints = endpoints.concat([this.fromDB(item)]);
    }
    return endpoints;
  }

  inflight fromDB(item: Json): Endpoint {
    return {
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      environmentId: item.get("environmentId").asStr(),
      path: item.get("path").asStr(),
      type: item.get("type").asStr(),
      localUrl: item.get("localUrl").asStr(),
      publicUrl: item.get("publicUrl").asStr(),
      port: item.get("port").asNum(),
      digest: item.get("digest").asStr(),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
    };
  }
}
