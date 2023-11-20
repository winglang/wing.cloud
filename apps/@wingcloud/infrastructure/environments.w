bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./status-reports.w" as status_report;

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
  testResults: status_report.TestResults?;
}

struct Item extends Environment {
  pk: str;
  sk: str;
}

pub struct CreateEnvironmentOptions {
  appId: str;
  type: str;
  repo: str;
  branch: str;
  status: str;
  prNumber: num?;
  prTitle: str?;
  installationId: num;
}

struct UpdateEnvironmentStatusOptions {
  id: str;
  appId: str;
  status: str;
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
  branch: str;
}

struct ListEnvironmentOptions {
  appId: str;
}

struct MakeItemOptions {
  pk: str;
  sk: str;
}


pub class Environments {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateEnvironmentOptions): Environment {
    let createdAt = datetime.utcNow().toIso();
    let environment = Environment {
      id: "environment_${nanoid62.Nanoid62.generate()}",
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
      };

      if let prNumber = environment.prNumber {
        item.set("prNumber", prNumber);
      }

      return item;
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: makeItem(pk: "ENVIRONMENT#${environment.id}", sk: "#"),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: makeItem(
            pk: "APP#${environment.appId}",
            sk: "ENVIRONMENT#${environment.id}"
          ),
        },
      },
      {
        put: {
          item: makeItem(
            pk: "APP#${environment.appId}",
            sk: "ENVIRONMENT#${environment.id}"
          ),
        },
      },
      {
        put: {
          item: makeItem(
            pk: "BRANCH#${environment.branch}",
            sk: "ENVIRONMENT#${environment.id}"
          ),
        },
      },
    ]);

    return environment;
  }

  pub inflight updateStatus(options: UpdateEnvironmentStatusOptions) {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
            sk: "#",
          },
          updateExpression: "SET #status = :status",
          conditionExpression: "attribute_exists(#pk) and #appId = :appId",
          expressionAttributeNames: {
            "#pk": "pk",
            "#status": "status",
            "#appId": "appId",
          },
          expressionAttributeValues: {
            ":status": options.status,
            ":appId": options.appId,
          },
        }
      },
      {
        update: {
          key: {
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
          },
          updateExpression: "SET #status = :status",
          expressionAttributeNames: {
            "#status": "status",
          },
          expressionAttributeValues: {
            ":status": options.status,
          },
        }
      },
    ]);
  }

  pub inflight updateUrl(options: UpdateEnvironmentUrlOptions) {
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
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
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
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
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
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
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
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
    this.table.transactWriteItems(transactItems: [
      {
        update: {
          key: {
            pk: "ENVIRONMENT#${options.id}",
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
            pk: "APP#${options.appId}",
            sk: "ENVIRONMENT#${options.id}",
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
    ]);
  }

  pub inflight get(options: GetEnvironmentOptions): Environment {
    let result = this.table.getItem(
      key: {
        pk: "BRANCH#${options.branch}",
        sk: "#",
      },
    );

    if let item = result.item {
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
      };
    }

    throw "Environment [${options.id}] not found";
  }

  pub inflight list(options: ListEnvironmentOptions): Array<Environment> {
    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "APP#${options.appId}",
        ":sk": "ENVIRONMENT#",
      },
    );
    let var environments: Array<Environment> = [];
    for item in result.items {
      environments = environments.concat([{
        id: item.get("id").asStr(),
        appId: item.get("appId").asStr(),
        type: item.get("type").asStr(),
        repo: item.get("repo").asStr(),
        branch: item.get("branch").asStr(),
        status: item.get("status").asStr(),
        prNumber: item.tryGet("prNumber")?.tryAsNum(),
        prTitle: item.tryGet("prTitle")?.tryAsStr(),
        installationId: item.get("installationId").asNum(),
        // https://github.com/winglang/wing/issues/4470
        url: item.tryGet("url")?.tryAsStr(),
        commentId: item.tryGet("commentId")?.tryAsNum(),
        testResults: status_report.TestResults.tryFromJson(item.tryGet("testResults")),
        createdAt: item.get("createdAt").asStr(),
        updatedAt: item.get("updatedAt").asStr(),
      }]);
    }
    return environments;
  }
}
