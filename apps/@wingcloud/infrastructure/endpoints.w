
bring "./nanoid62.w" as nanoid62;
bring "./status-reports.w" as status_report;
bring "./util.w" as util;
bring dynamodb;

pub struct Endpoint {
  id: str;
  appId: str;
  environmentId: str;
  path: str;
  label: str;
  browserSupport: bool;
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
  label: str;
  browserSupport: bool;
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
  table: dynamodb.Table;

  new(table: dynamodb.Table) {
    this.table = table;
  }

  pub inflight create(options: CreateEndpointOptions): Endpoint {
    let createdAt = datetime.utcNow().toIso();
    let endpoint = Endpoint {
      id: "endpoint_{nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      environmentId: options.environmentId,
      path: options.path,
      label: options.label,
      browserSupport: options.browserSupport,
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
        label: endpoint.label,
        browserSupport: endpoint.browserSupport,
        localUrl: endpoint.localUrl,
        publicUrl: endpoint.publicUrl,
        port: endpoint.port,
        digest: endpoint.digest,
        createdAt: endpoint.createdAt,
        updatedAt: endpoint.createdAt,
      };

      return item;
    };

    this.table.transactWrite(TransactItems: [
      {
        Put: {
          Item: makeItem(pk: "ENVIRONMENT#{endpoint.environmentId}", sk: "ENDPOINT#{endpoint.id}"),
          ConditionExpression: "attribute_not_exists(pk)"
        },
      },
    ]);

    return endpoint;
  }

  pub inflight get(options: GetEndpointOptions): Endpoint {
    let result = this.table.get(
      Key: {
        pk: "ENVIRONMENT#{options.environmentId}",
        sk: "ENDPOINT#{options.id}",
      },
    );

    if let item = result.Item {
      return this.fromDB(item);
    }

    throw "Endpoint [{options.id}] not found";
  }

  pub inflight delete(options: DeleteEndpointOptions) {
    let result = this.table.delete(
      Key: {
        pk: "ENVIRONMENT#{options.environmentId}",
        sk: "ENDPOINT#{options.id}",
      },
    );
  }

  pub inflight list(options: ListEndpointsOptions): Array<Endpoint> {
    let var exclusiveStartKey: Json? = nil;
    let var endpoints: Array<Endpoint> = [];
    util.Util.do_while(
      handler: () => {
        let result = this.table.query(
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
          ExpressionAttributeValues: {
            ":pk": "ENVIRONMENT#{options.environmentId}",
            ":sk": "ENDPOINT#",
          },
          ExclusiveStartKey: exclusiveStartKey,
        );
        for item in result.Items {
          endpoints = endpoints.concat([this.fromDB(item)]);
        }
        exclusiveStartKey = result.LastEvaluatedKey;
      },
      condition: () => {
        return exclusiveStartKey?;
      },
    );
    return endpoints;
  }

  inflight fromDB(item: Json): Endpoint {
    return {
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      environmentId: item.get("environmentId").asStr(),
      path: item.get("path").asStr(),
      label: item.get("label").asStr(),
      browserSupport: item.get("browserSupport").asBool(),
      localUrl: item.get("localUrl").asStr(),
      publicUrl: item.get("publicUrl").asStr(),
      port: num.fromStr(item.get("port").get("value").asStr()),
      digest: item.get("digest").asStr(),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
    };
  }
}
