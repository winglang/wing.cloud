bring "./nanoid62.w" as nanoid62;
bring "./status-reports.w" as status_report;
bring "./http-error.w" as httpError;
bring "./util.w" as util;
bring dynamodb;

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
  table: dynamodb.Table;

  new(table: dynamodb.Table) {
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

    this.table.transactWrite(TransactItems: [
      {
        Put: {
          Item: this.makeItem(
            pk: "ENVIRONMENT#{environment.id}",
            sk: "#",
            environment: environment
          ),
          ConditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        Put: {
          Item: this.makeItem(
            pk: "APP#{environment.appId}",
            sk: "ENVIRONMENT#{environment.id}",
            environment: environment,
          ),
        },
      },
      {
        Put: {
          Item: this.makeItem(
            pk: "APP#{environment.appId}",
            sk: "BRANCH#{environment.branch}",
            environment: environment,
          ),
        },
      },
      {
        Put: {
          Item: this.makeItem(
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

    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "SET #publicKey = :publicKey",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#publicKey": "publicKey",
            "#appId": "appId",
          },
          ExpressionAttributeValues: {
            ":publicKey": options.publicKey,
            ":appId": options.appId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "SET #publicKey = :publicKey",
          ExpressionAttributeNames: {
            "#publicKey": "publicKey",
          },
          ExpressionAttributeValues: {
            ":publicKey": options.publicKey,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          UpdateExpression: "SET #publicKey = :publicKey",
          ExpressionAttributeNames: {
            "#publicKey": "publicKey",
          },
          ExpressionAttributeValues: {
            ":publicKey": options.publicKey,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          UpdateExpression: "SET #publicKey = :publicKey",
          ExpressionAttributeNames: {
            "#publicKey": "publicKey",
          },
          ExpressionAttributeValues: {
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

    let var transactItems: MutArray<dynamodb.TransactWriteItem> = MutArray<dynamodb.TransactWriteItem>[
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#appId": "appId",
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":appId": options.appId,
            ":status": options.status,
            ":updatedAt": now.toIso(),
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":status": options.status,
            ":updatedAt": now.toIso(),
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{environment.branch}",
          },
          UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":status": options.status,
            ":updatedAt": now.toIso(),
          },
        }
      },
    ];

    if lastStatusUpdatedAt != statusUpdatedAt {
      // replace last status update
      transactItems = transactItems.concat(MutArray<dynamodb.TransactWriteItem>[
        {
          Delete: {
            Key: {
              pk: "DEPLOYED#{lastStatusUpdatedAt}",
              sk: "ENV#{environment.id}"
            },
          }
        },
        {
          Put: {
            Item: this.makeItem(
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
      transactItems = transactItems.concat(MutArray<dynamodb.TransactWriteItem>[
        {
          Update: {
            Key: {
              pk: "DEPLOYED#{statusUpdatedAt}",
              sk: "ENV#{environment.id}",
            },
            UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
            ExpressionAttributeNames: {
              "#status": "status",
              "#updatedAt": "updatedAt",
            },
            ExpressionAttributeValues: {
              ":status": options.status,
              ":updatedAt": now.toIso(),
            },
          }
        },
      ]);
    }

    this.table.transactWrite(TransactItems: transactItems.copy());
  }

  pub inflight updateSha(options: UpdateEnvironmentShaOptions) {
    let environment = this.get(id: options.id);
    let branch = environment.branch;
    let updatedAt = datetime.fromIso(environment.updatedAt);
    let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";

    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "SET #sha = :sha",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#sha": "sha",
            "#appId": "appId",
          },
          ExpressionAttributeValues: {
            ":sha": options.sha,
            ":appId": options.appId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "SET #sha = :sha",
          ExpressionAttributeNames: {
            "#sha": "sha",
          },
          ExpressionAttributeValues: {
            ":sha": options.sha,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          UpdateExpression: "SET #sha = :sha",
          ExpressionAttributeNames: {
            "#sha": "sha",
          },
          ExpressionAttributeValues: {
            ":sha": options.sha,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          UpdateExpression: "SET #sha = :sha",
          ExpressionAttributeNames: {
            "#sha": "sha",
          },
          ExpressionAttributeValues: {
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

    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "SET #url = :url",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#url": "url",
            "#appId": "appId",
          },
          ExpressionAttributeValues: {
            ":url": options.url,
            ":appId": options.appId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "SET #url = :url",
          ExpressionAttributeNames: {
            "#url": "url",
          },
          ExpressionAttributeValues: {
            ":url": options.url,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          UpdateExpression: "SET #url = :url",
          ExpressionAttributeNames: {
            "#url": "url",
          },
          ExpressionAttributeValues: {
            ":url": options.url,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          UpdateExpression: "SET #url = :url",
          ExpressionAttributeNames: {
            "#url": "url",
          },
          ExpressionAttributeValues: {
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

    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "SET #commentId = :commentId",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#commentId": "commentId",
            "#appId": "appId",
          },
          ExpressionAttributeValues: {
            ":commentId": options.commentId,
            ":appId": options.appId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "SET #commentId = :commentId",
          ExpressionAttributeNames: {
            "#commentId": "commentId",
          },
          ExpressionAttributeValues: {
            ":commentId": options.commentId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          UpdateExpression: "SET #commentId = :commentId",
          ExpressionAttributeNames: {
            "#commentId": "commentId",
          },
          ExpressionAttributeValues: {
            ":commentId": options.commentId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          UpdateExpression: "SET #commentId = :commentId",
          ExpressionAttributeNames: {
            "#commentId": "commentId",
          },
          ExpressionAttributeValues: {
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

    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "SET #testResults = :testResults",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#testResults": "testResults",
            "#appId": "appId",
          },
          ExpressionAttributeValues: {
            ":testResults": options.testResults,
            ":appId": options.appId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "SET #testResults = :testResults",
          ExpressionAttributeNames: {
            "#testResults": "testResults",
          },
          ExpressionAttributeValues: {
            ":testResults": options.testResults,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          UpdateExpression: "SET #testResults = :testResults",
          ExpressionAttributeNames: {
            "#testResults": "testResults",
          },
          ExpressionAttributeValues: {
            ":testResults": options.testResults,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          UpdateExpression: "SET #testResults = :testResults",
          ExpressionAttributeNames: {
            "#testResults": "testResults",
          },
          ExpressionAttributeValues: {
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

    this.table.transactWrite(TransactItems: [
      {
        Update: {
          Key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          UpdateExpression: "REMOVE testResults",
          ConditionExpression: "attribute_exists(#pk) and #appId = :appId",
          ExpressionAttributeNames: {
            "#pk": "pk",
            "#appId": "appId",
          },
          ExpressionAttributeValues: {
            ":appId": options.appId,
          },
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          UpdateExpression: "REMOVE testResults",
        }
      },
      {
        Update: {
          Key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{branch}",
          },
          UpdateExpression: "REMOVE testResults",
        }
      },
      {
        Update: {
          Key: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{options.id}",
          },
          UpdateExpression: "REMOVE testResults",
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
    let result = this.table.get(
      Key: {
        pk: "ENVIRONMENT#{options.id}",
        sk: "#",
      },
    );

    if let item = result.Item {
      return this.fromDB(item);
    }

    throw httpError.HttpError.notFound("Environment '{options.id}' not found");
  }

  pub inflight getPublicKey(options: GetEnvironmentOptions): str {
    return this.get(id: options.id).publicKey;
  }

  pub inflight getByBranch(options: GetEnvironmentByBranchOptions): Environment {
    let result = this.table.get(
      Key: {
        pk: "APP#{options.appId}",
        sk: "BRANCH#{options.branch}",
      },
    );

    if let item = result.Item {
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
          KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
          ExpressionAttributeValues: {
            ":pk": "APP#{options.appId}",
            ":sk": "ENVIRONMENT#",
          },
          ExclusiveStartKey: exclusiveStartKey,
        );
        for item in result.Items {
          environments = environments.concat([this.fromDB(item)]);
        }
        exclusiveStartKey = result.LastEvaluatedKey;
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
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "DEPLOYED#{statusUpdatedAt}",
          },
          ExclusiveStartKey: exclusiveStartKey,
        );
        for item in result.Items {
          environments = environments.concat([this.fromDB(item)]);
        }
        exclusiveStartKey = result.LastEvaluatedKey;
      },
      condition: () => {
        return exclusiveStartKey?;
      },
    );
    return environments;
  }

  pub inflight delete(options: DeleteEnvironmentOptions): void {
    let result = this.table.get(
      Key: {
        pk: "ENVIRONMENT#{options.environmentId}",
        sk: "#",
      },
    );

    if let app = result.Item {
      let updatedAt = datetime.fromIso(app.get("updatedAt").asStr());
      let statusUpdatedAt = "{updatedAt.dayOfMonth}_{updatedAt.month}";
      let result = this.table.transactWrite(TransactItems: [
        {
          Delete: {
            Key: {
              pk: "ENVIRONMENT#{options.environmentId}",
              sk: "#",
            },
            ConditionExpression: "attribute_exists(#pk)",
            ExpressionAttributeNames: {
              "#pk": "pk",
            },
          }
        },
        {
          Delete: {
            Key: {
              pk: "APP#{options.appId}",
              sk: "ENVIRONMENT#{options.environmentId}",
            },
          }
        },
        {
          Delete: {
            Key: {
              pk: "APP#{options.appId}",
              sk: "BRANCH#{app.get("branch").asStr()}",
            },
          }
        },
        {
          Delete: {
            Key: {
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

    let installationId = item.get("installationId").get("value").asStr();
    let commentId = item.tryGet("commentId")?.tryGet("value")?.tryAsStr();

    return {
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      type: item.get("type").asStr(),
      repo: item.get("repo").asStr(),
      branch: item.get("branch").asStr(),
      sha: item.get("sha").asStr(),
      status: item.get("status").asStr(),
      installationId: num.fromStr(installationId),
      prNumber: item.tryGet("prNumber")?.tryGet("value")?.tryAsNum(),
      prTitle: item.tryGet("prTitle")?.tryAsStr(),
      url: item.tryGet("url")?.tryAsStr(),
      commentId: num.fromStr(commentId ?? ""),
      testResults: status_report.TestResults.tryFromJson(item.tryGet("testResults")),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
      publicKey: item.get("publicKey").asStr(),
    };
  }
}
