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
  url: str?;
  commentId: num?;
  testResults: status_report.TestResults?;
}

pub struct CreateEnvironmentOptions {
  appId: str;
  type: str;
  repo: str;
  branch: str;
  status: str;
  prNumber: num?;
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
  id: str;
}

struct ListEnvironmentOptions {
  appId: str;
}

pub class Environments {
  table: ex.DynamodbTable;

  init(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateEnvironmentOptions): Environment {
    let environment = Environment {
      id: "environment_${nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      type: options.type,
      repo: options.repo,
      branch: options.branch,
      status: options.status,
      prNumber: options.prNumber,
      installationId: options.installationId,
    };

    let getItem = (pk: str, sk: str) => {
      let item = MutJson {
        pk: pk,
        sk: sk,
        id: environment.id,
        appId: environment.appId,
        type: environment.type,
        repo: environment.repo,
        branch: environment.branch,
        status: environment.status,
        installationId: environment.installationId,
      };

      if let prNumber = environment.prNumber {
        item.set("prNumber", prNumber);
      }

      return item;
    };

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: getItem("ENVIRONMENT#${environment.id}", "#"),
          conditionExpression: "attribute_not_exists(pk)"
        },
      },
      {
        put: {
          item: getItem("APP#${environment.appId}", "ENVIRONMENT#${environment.id}"),
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
        pk: "ENVIRONMENT#${options.id}",
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
        url: item.tryGet("url")?.tryAsStr(),
        commentId: item.tryGet("commentId")?.tryAsNum(),
        testResults: status_report.TestResults.tryFromJson(item.tryGet("testResults")),
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
        installationId: item.get("installationId").asNum(),
        // https://github.com/winglang/wing/issues/4470
        url: item.tryGet("url")?.tryAsStr(),
        commentId: item.tryGet("commentId")?.tryAsNum(),
        testResults: status_report.TestResults.tryFromJson(item.tryGet("testResults")),
      }]);
    }
    return environments;
  }
}
