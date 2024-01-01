bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./status-reports.w" as status_report;
bring "./http-error.w" as httpError;

pub struct Environment {
  id: str;
  appId: str;
  type: str;
  repo: str;
  branch: str;
  status: str;
  installationId: num;
  prNumber: num?;
  prTitle: str?;
  url: str?;
  commentId: num?;
  createdAt: str;
  updatedAt: str;
  statusUpdatedAt: str;
  testResults: status_report.TestResults?;
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
      status: options.status,
      prNumber: options.prNumber,
      prTitle: options.prTitle,
      installationId: options.installationId,
      createdAt: createdAt,
      updatedAt: createdAt,
      statusUpdatedAt: statusUpdatedAt,
    };

    let makeItem = (ops: MakeItemOptions) => {
      let item = MutJson {
        pk: ops.pk,
        sk: ops.sk,
        id: environment.id,
        appId: environment.appId,
        type: environment.type,
        repo: environment.repo,
        branch: environment.branch,
        prTitle: environment.prTitle,
        status: environment.status,
        installationId: environment.installationId,
        createdAt: environment.createdAt,
        updatedAt: environment.updatedAt,
        statusUpdatedAt: environment.statusUpdatedAt,
        publicKey: options.publicKey,
      };

      if let prNumber = environment.prNumber {
        item.set("prNumber", prNumber);
      }

      return item;
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: makeItem(pk: "ENVIRONMENT#{environment.id}", sk: "#"),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: makeItem(
            pk: "APP#{environment.appId}",
            sk: "ENVIRONMENT#{environment.id}"
          ),
        },
      },
      {
        put: {
          item: makeItem(
            pk: "APP#{environment.appId}",
            sk: "BRANCH#{environment.branch}"
          ),
        },
      },
      {
        put: {
          item: {
            pk: "DEPLOYED#{environment.statusUpdatedAt}",
            sk: "ENV#{environment.id}",
            id: environment.id,
          },
        },
      },
    ]);

    return environment;
  }

  pub inflight updatePublicKey(options: UpdateEnvirohmentPublicKeyOptions) {
    let branch = this.get(
      id: options.id,
    ).branch;

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
    ]);
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    let now = datetime.utcNow();
    let statusUpdatedAt = "{now.dayOfMonth}_{now.month}";
    let environment = this.get(id: options.id);

    let transactItems: MutArray<ex.DynamodbTransactWriteItem> = MutArray<ex.DynamodbTransactWriteItem>[
      {
        update: {
          key: {
            pk: "ENVIRONMENT#{options.id}",
            sk: "#",
          },
          updateExpression: "SET #status = :status, #statusUpdatedAt = :statusUpdatedAt",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#appId": "appId",
            "#status": "status",
            "#statusUpdatedAt": "statusUpdatedAt",
          },
          expressionAttributeValues: {
            ":appId": options.appId,
            ":status": options.status,
            ":statusUpdatedAt": statusUpdatedAt,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "ENVIRONMENT#{options.id}",
          },
          updateExpression: "SET #status = :status, #statusUpdatedAt = :statusUpdatedAt",
          expressionAttributeNames: {
            "#status": "status",
            "#statusUpdatedAt": "statusUpdatedAt",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":statusUpdatedAt": statusUpdatedAt,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#{options.appId}",
            sk: "BRANCH#{environment.branch}",
          },
          updateExpression: "SET #status = :status, #statusUpdatedAt = :statusUpdatedAt",
          expressionAttributeNames: {
            "#status": "status",
            "#statusUpdatedAt": "statusUpdatedAt",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":statusUpdatedAt": statusUpdatedAt,
          },
        }
      },
    ];

    // replace last status update
    if environment.statusUpdatedAt != statusUpdatedAt {
      transactItems.concat(MutArray<ex.DynamodbTransactWriteItem>[{
        delete: {
          key: {
            pk: "DEPLOYED#{environment.statusUpdatedAt}",
            sk: "ENV#{environment.id}"
          },
        }
      },
      {
        put: {
          item: {
            pk: "DEPLOYED#{statusUpdatedAt}",
            sk: "ENV#{environment.id}"
          },
        },
      }]);
    }

    this.table.transactWriteItems(transactItems: transactItems.copy());
  }

  pub inflight updateUrl(options: UpdateEnvironmentUrlOptions) {
    let branch = this.get(
      id: options.id,
    ).branch;

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
    ]);
  }

  pub inflight updateCommentId(options: UpdateEnvironmentCommentIdOptions) {
    let branch = this.get(
      id: options.id,
    ).branch;

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
    ]);
  }

  pub inflight updateTestResults(options: UpdateEnvironmentTestResultsOptions) {
    let branch = this.get(
      id: options.id,
    ).branch;

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
      }
    ]);
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
    let result = this.table.getItem(
      key: {
        pk: "ENVIRONMENT#{options.id}",
        sk: "#",
      },
      projectionExpression: "publicKey",
    );

    if let item = result.item {
      return item.get("publicKey").asStr();
    }

    throw httpError.HttpError.notFound("Environment '{options.id}' not found");
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
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "APP#{options.appId}",
        ":sk": "ENVIRONMENT#",
      },
    );
    let var environments: Array<Environment> = [];
    for item in result.items {
      environments = environments.concat([this.fromDB(item)]);
    }
    return environments;
  }

  pub inflight listDeployedAt(options: ListEnvironmentDeployedAtOptions): Array<Environment> {
    let statusUpdatedAt = "{options.deployedAt.dayOfMonth}_{options.deployedAt.month}";
    let result = this.table.query(
      keyConditionExpression: "pk = :pk",
      expressionAttributeValues: {
        ":pk": "DEPLOYED#{statusUpdatedAt}",
      },
    );
    let var environments: Array<Environment> = [];
    for item in result.items {
      let environment = this.get(id: item.get("id").asStr());
      environments = environments.concat([environment]);
    }
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
              pk: "DEPLOYED#{app.get("statusUpdatedAt").asStr()}",
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
      status: item.get("status").asStr(),
      installationId: item.get("installationId").asNum(),
      prNumber: item.tryGet("prNumber")?.tryAsNum(),
      prTitle: item.tryGet("prTitle")?.tryAsStr(),
      url: item.tryGet("url")?.tryAsStr(),
      commentId: item.tryGet("commentId")?.tryAsNum(),
      testResults: status_report.TestResults.tryFromJson(item.tryGet("testResults")),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
      statusUpdatedAt: item.get("statusUpdatedAt").asStr(),
    };
  }
}
