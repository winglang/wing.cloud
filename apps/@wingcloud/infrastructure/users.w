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

struct GetUsernameOptions {
  userId: str;
}

pub class Users {
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
              pk: "LOGIN#${options.gitHubLogin}",
              sk: "#",
              id: userId,
            },
            conditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          put: {
            item: {
              pk: "USER#${userId}",
              sk: "#",
              id: userId,
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
        pk: "LOGIN#${options.gitHubLogin}",
        sk: "#",
      },
    );

    return result.item?.tryGet("id")?.tryAsStr();
  }

  pub inflight getOrCreate(options: GetOrCreateOptions): str {
    let userId = this.fromLogin(gitHubLogin: options.gitHubLogin);

    return userId ?? this.create(gitHubLogin: options.gitHubLogin);
  }

  pub inflight getUsername(options: GetUsernameOptions): str {
    let result = this.table.getItem(
      key: {
        pk: "USER#${options.userId}",
        sk: "#",
      },
    );

    if let username = result.item?.tryGet("gitHubLogin")?.tryAsStr() {
      return username;
    } else {
      throw "User not found";
    }
  }
}
