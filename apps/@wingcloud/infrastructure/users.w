bring ex;
bring "./nanoid62.w" as Nanoid62;

struct User {
  id: str;
}

struct CreateOptions {
  gitHubLogin: str;
}

struct FromLoginOptions {
  gitHubLogin: str;
}

struct GetOrCreateOptions {
  gitHubLogin: str;
}

class Users {
  table: ex.DynamodbTable;

  init(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateOptions): str {
    let userId = "user_${Nanoid62.Nanoid62.generate()}";
    log("userId = ${userId}");

    this.table.transactWriteItems(
      transactItems: [
        {
          put: {
            item: {
              pk: "login#${options.gitHubLogin}",
              sk: "#",
              userId: userId,
            },
            conditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          put: {
            item: {
              pk: "user#${userId}",
              sk: "#",
              userId: userId,
              gitHubLogin: options.gitHubLogin,
            },
          }
        }
      ],
    );

    return userId;
  }

  pub inflight fromLogin(options: FromLoginOptions): str? {
    let result = this.table.getItem(
      key: {
        pk: "login#${options.gitHubLogin}",
        sk: "#",
      },
    );

    return result.item?.tryGet("userId")?.tryAsStr();
  }

  pub inflight getOrCreate(options: GetOrCreateOptions): str {
    let userId = this.fromLogin(gitHubLogin: options.gitHubLogin);

    return userId ?? this.create(gitHubLogin: options.gitHubLogin);
  }
}
