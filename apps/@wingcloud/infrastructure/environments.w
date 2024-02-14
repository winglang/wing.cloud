bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./status-reports.w" as status_report;
bring "./http-error.w" as httpError;
bring "./util.w" as util;

pub struct Environment {
  id: str;
  appId: str;
  type: str;
  repo: str;
  branch: str;
  sha: str;
  status: str;
  installationId: num;
  prNumber: num?;
  prTitle: str?;
  url: str?;
  commentId: num?;
  createdAt: str;
  updatedAt: str;
  testResults: status_report.TestResults?;
  publicKey: str;
}

struct Item extends Environment {
  pk: str;
  sk: str;
}

pub struct EnvironmentOptions {
  appId: str;
  type: str;
  repo: str;
  branch: str;
  sha: str;
  status: str;
  prNumber: num?;
  prTitle: str?;
  installationId: num;
}

pub struct CreateEnvironmentOptions extends EnvironmentOptions {
  publicKey: str;
}

struct UpdateEnvironmentStatusOptions {
  id: str;
  appId: str;
  status: str;
}

struct UpdateEnvironmentShaOptions {
  id: str;
  appId: str;
  sha: str;
}

struct UpdateEnvirohmentPublicKeyOptions {
  id: str;
  appId: str;
  publicKey: str;
}

struct UpdateEnvironmentUrlOptions {
  id: str;
  appId: str;
  url: str;
}

struct UpdateEnvironmentCommentIdOptions {
  id: str;
  appId: str;
  commentId: num;
}

struct UpdateEnvironmentTestResultsOptions {
  id: str;
  appId: str;
  testResults: status_report.TestResults;
}

struct ClearEnvironmentTestResultsOptions {
  id: str;
  appId: str;
}

struct GetEnvironmentOptions {
  id: str;
}

struct GetEnvironmentByBranchOptions {
  appId: str;
  branch: str;
}

struct ListEnvironmentOptions {
  appId: str;
}

struct ListEnvironmentDeployedAtOptions {
  deployedAt: std.Datetime;
}

struct MakeItemOptions {
  pk: str;
  sk: str;
  environment: Environment;
  updatedAt: str?;
  status: str?;
}

struct DeleteEnvironmentOptions {
  appId: str;
  environmentId: str;
}

pub class Environments {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  inflight makeItem(ops: MakeItemOptions): Json {
    let item = MutJson {
      pk: ops.pk,
      sk: ops.sk,
      id: ops.environment.id,
      appId: ops.environment.appId,
      type: ops.environment.type,
      repo: ops.environment.repo,
      branch: ops.environment.branch,
      sha: ops.environment.sha,
      prTitle: ops.environment.prTitle,
      status: ops.environment.status,
      installationId: ops.environment.installationId,
      createdAt: ops.environment.createdAt,
      updatedAt: ops.environment.updatedAt,
      publicKey: ops.environment.publicKey,
    };

    if let prNumber = ops.environment.prNumber {
      item.set("prNumber", prNumber);
    }

    if let updatedAt = ops.updatedAt {
      item.set("updatedAt", updatedAt);
    }

    if let status = ops.status {
      item.set("status", status);
    }

    return item;
  }

  pub inflight create(options: CreateEnvironmentOptions): Environment {
    let now = datetime.utcNow();
    let createdAt = now.toIso();
    let statusUpdatedAt = "{now.dayOfMonth}_{now.month}";
    let environment = Environment {
      id: "environment_{nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      type: options.type,
      repo: options.repo,
      branch: options.branch,
      sha: options.sha,
      status: options.status,
      prNumber: options.prNumber,
      prTitle: options.prTitle,
      installationId: options.installationId,
      createdAt: createdAt,
      updatedAt: createdAt,
      publicKey: options.publicKey,
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: this.makeItem(
            pk: "ENVIRONMENT#{environment.id}",
            sk: "#",
            environment: environment
          ),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: this.makeItem(
            pk: "APP#{environment.appId}",
            sk: "ENVIRONMENT#{environment.id}",
            environment: environment,
          ),
        },
      },
      {
        put: {
          item: this.makeItem(
            pk: "APP#{environment.appId}",
            sk: "BRANCH#{environment.branch}",
            environment: environment,
          ),
        },
      },
      {
        put: {
          item: this.makeItem(
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{environment.id}",
            environment: environment,
          ),
        },
      },
    ]);

    return environment;
  }

  pub inflight updatePublicKey(options: UpdateEnvirohmentPublicKeyOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #publicKey = :publicKey",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#publicKey": "publicKey",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":publicKey": options.publicKey,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #publicKey = :publicKey",
          expressionAttributeNames: {
            "#publicKey": "publicKey",
          },
          expressionAttributeValues: {
            ":publicKey": options.publicKey,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          updateExpression: "SET #publicKey = :publicKey",
          expressionAttributeNames: {
            "#publicKey": "publicKey",
          },
          expressionAttributeValues: {
            ":publicKey": options.publicKey,
          },
        }
      },
      {
        update: {
          key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          updateExpression: "SET #publicKey = :publicKey",
          expressionAttributeNames: {
            "#publicKey": "publicKey",
          },
          expressionAttributeValues: {
            ":publicKey": options.publicKey,
          },
        }
      },
    ]);
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    let now = datetime.utcNow();
    let statusUpdatedAt = "{now.dayOfMonth}_{now.month}";
    let environment = this.get(id: options.id);
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let lastStatusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    let var transactItems: MutArray<ex.DynamodbTransactWriteItem> = MutArray<ex.DynamodbTransactWriteItem>[
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#appId": "appId",
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          expressionAttributeValues: {
            ":appId": options.appId,
            ":status": options.status,
            ":updatedAt": now.toIso(),
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          expressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":updatedAt": now.toIso(),
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{environment.branch}",
          },
          updateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          expressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":updatedAt": now.toIso(),
          },
        }
      },
    ];

    if lastStatusUpdatedAt != statusUpdatedAt {
      // replace last status update
      transactItems = transactItems.concat(MutArray<ex.DynamodbTransactWriteItem>[
        {
          delete: {
            key: {
              pk: "DEPLOYED#{lastStatusUpdatedAt}",
              sk: "ENV#{environment.id}"
            },
          }
        },
        {
          put: {
            item: this.makeItem(
              pk: "DEPLOYED#{statusUpdatedAt}",
              sk: "ENV#{environment.id}",
              environment: environment,
              updatedAt: now.toIso(),
              status: options.status,
            ),
          },
        }
      ]);
    } else {
      transactItems = transactItems.concat(MutArray<ex.DynamodbTransactWriteItem>[
        {
          update: {
            key: {
              pk: "DEPLOYED#{statusUpdatedAt}",
              sk: "ENV#{environment.id}",
            },
            updateExpression: "SET #status = :status, #updatedAt = :updatedAt",
            expressionAttributeNames: {
              "#status": "status",
              "#updatedAt": "updatedAt",
            },
            expressionAttributeValues: {
              ":status": options.status,
              ":updatedAt": now.toIso(),
            },
          }
        },
      ]);
    }

    this.table.transactWriteItems(transactItems: transactItems.copy());
  }

  pub inflight updateSha(options: UpdateEnvironmentShaOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #sha = :sha",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#sha": "sha",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":sha": options.sha,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #sha = :sha",
          expressionAttributeNames: {
            "#sha": "sha",
          },
          expressionAttributeValues: {
            ":sha": options.sha,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          updateExpression: "SET #sha = :sha",
          expressionAttributeNames: {
            "#sha": "sha",
          },
          expressionAttributeValues: {
            ":sha": options.sha,
          },
        }
      },
      {
        update: {
          key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          updateExpression: "SET #sha = :sha",
          expressionAttributeNames: {
            "#sha": "sha",
          },
          expressionAttributeValues: {
            ":sha": options.sha,
          },
        }
      },
    ]);
  }

  pub inflight updateUrl(options: UpdateEnvironmentUrlOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #url = :url",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#url": "url",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":url": options.url,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #url = :url",
          expressionAttributeNames: {
            "#url": "url",
          },
          expressionAttributeValues: {
            ":url": options.url,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          updateExpression: "SET #url = :url",
          expressionAttributeNames: {
            "#url": "url",
          },
          expressionAttributeValues: {
            ":url": options.url,
          },
        }
      },
      {
        update: {
          key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          updateExpression: "SET #url = :url",
          expressionAttributeNames: {
            "#url": "url",
          },
          expressionAttributeValues: {
            ":url": options.url,
          },
        }
      },
    ]);
  }

  pub inflight updateCommentId(options: UpdateEnvironmentCommentIdOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #commentId = :commentId",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#commentId": "commentId",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #commentId = :commentId",
          expressionAttributeNames: {
            "#commentId": "commentId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          updateExpression: "SET #commentId = :commentId",
          expressionAttributeNames: {
            "#commentId": "commentId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          updateExpression: "SET #commentId = :commentId",
          expressionAttributeNames: {
            "#commentId": "commentId",
          },
          expressionAttributeValues: {
            ":commentId": options.commentId,
          },
        }
      },
    ]);
  }

  pub inflight updateTestResults(options: UpdateEnvironmentTestResultsOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #testResults = :testResults",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#testResults": "testResults",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":testResults": options.testResults,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #testResults = :testResults",
          expressionAttributeNames: {
            "#testResults": "testResults",
          },
          expressionAttributeValues: {
            ":testResults": options.testResults,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          updateExpression: "SET #testResults = :testResults",
          expressionAttributeNames: {
            "#testResults": "testResults",
          },
          expressionAttributeValues: {
            ":testResults": options.testResults,
          },
        }
      },
      {
        update: {
          key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          updateExpression: "SET #testResults = :testResults",
          expressionAttributeNames: {
            "#testResults": "testResults",
          },
          expressionAttributeValues: {
            ":testResults": options.testResults,
          },
        }
      }
    ]);
  }

  pub inflight clearTestResults(options: ClearEnvironmentTestResultsOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "REMOVE testResults",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "REMOVE testResults",
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          updateExpression: "REMOVE testResults",
        }
      },
      {
        update: {
          key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          updateExpression: "REMOVE testResults",
        }
      }
    ]);
  }

  pub inflight tryGet(options: GetEnvironmentOptions): Environment? {
    try {
      return this.get(options);
    } catch error {
      return nil;
    }
  }

  pub inflight get(options: GetEnvironmentOptions): Environment {
    let result = this.table.getItem(
      key: {
        pk: "ENVIRONMENT#{options.id}",
        sk: "#",
      },
    );

    if let item = result.item {
      return this.fromDB(item);
    }

    throw httpError.HttpError.notFound("Environment '{options.id}' not found");
  }

  pub inflight getPublicKey(options: GetEnvironmentOptions): str {
    return this.get(id: options.id).publicKey;
  }

  pub inflight getByBranch(options: GetEnvironmentByBranchOptions): Environment {
    let result = this.table.getItem(
      key: {
        pk: "APP#{options.appId}",
        sk: "BRANCH#{options.branch}",
      },
    );

    if let item = result.item {
      return this.fromDB(item);
    }

    throw httpError.HttpError.notFound("Environment '{options.branch}' not found");
  }

  pub inflight list(options: ListEnvironmentOptions): Array<Environment> {
    let var exclusiveStartKey: Json? = nil;
    let var environments: Array<Environment> = [];
    util.Util.do_while(
      handler: () => {
        let result = this.table.query(
          keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
          expressionAttributeValues: {
            ":pk": "APP#{options.appId}",
            ":sk": "ENVIRONMENT#",
          },
          exclusiveStartKey: exclusiveStartKey,
        );
        for item in result.items {
          environments = environments.concat([this.fromDB(item)]);
        }
        exclusiveStartKey = result.lastEvaluatedKey;
      },
      condition: () => {
        return exclusiveStartKey?;
      },
    );
    return environments;
  }

  pub inflight listDeployedAt(options: ListEnvironmentDeployedAtOptions): Array<Environment> {
    let statusUpdatedAt = "{options.deployedAt.dayOfMonth}_{options.deployedAt.month}";
    let var exclusiveStartKey: Json? = nil;
    let var environments: Array<Environment> = [];
    util.Util.do_while(
      handler: () => {
        let result = this.table.query(
          keyConditionExpression: "pk = :pk",
          expressionAttributeValues: {
            ":pk": "DEPLOYED#{statusUpdatedAt}",
          },
          exclusiveStartKey: exclusiveStartKey,
        );
        for item in result.items {
          environments = environments.concat([this.fromDB(item)]);
        }
        exclusiveStartKey = result.lastEvaluatedKey;
      },
      condition: () => {
        return exclusiveStartKey?;
      },
    );
    return environments;
  }

  pub inflight delete(options: DeleteEnvironmentOptions): void {
    let result = this.table.getItem(
      key: {
        pk: "ENVIRONMENT#{options.environmentId}",
        sk: "#",
      },
    );

    if let app = result.item {
      let updatedAt = datetime.fromIso(app.get("updatedAt").asStr());
      let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";
      let result = this.table.transactWriteItems(transactItems: [
        {
          delete: {
            key: {
              pk: "ENVIRONMENT#{options.environmentId}",
              sk: "#",
            },
            conditionExpression: "attribute_exists(#pk)",
            expressionAttributeNames: {
              "#pk": "pk",
            },
          }
        },
        {
          delete: {
            key: {
              pk: "APP#{options.appId}",
              sk: "ENVIRONMENT#{options.environmentId}",
            },
          }
        },
        {
          delete: {
            key: {
              pk: "APP#{options.appId}",
              sk: "BRANCH#{app.get("branch").asStr()}",
            },
          }
        },
        {
          delete: {
            key: {
              pk: "DEPLOYED#{statusUpdatedAt}",
              sk: "ENV#{options.environmentId}"
            },
          }
        },
      ]);
      return;
    }

    throw httpError.HttpError.notFound("Environment '{options.environmentId}' not found");
  }

  inflight fromDB(item: Json): Environment {
    return {
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      type: item.get("type").asStr(),
      repo: item.get("repo").asStr(),
      branch: item.get("branch").asStr(),
      sha: item.get("sha").asStr(),
      status: item.get("status").asStr(),
      installationId: item.get("installationId").asNum(),
      prNumber: item.tryGet("prNumber")?.tryAsNum(),
      prTitle: item.tryGet("prTitle")?.tryAsStr(),
      url: item.tryGet("url")?.tryAsStr(),
      commentId: item.tryGet("commentId")?.tryAsNum(),
      testResults: status_report.TestResults.tryFromJson(item.tryGet("testResults")),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
      publicKey: item.get("publicKey").asStr(),
    };
  }
}
