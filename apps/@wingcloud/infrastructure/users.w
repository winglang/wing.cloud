bring ex;
bring "./nanoid62.w" as Nanoid62;
bring "./http-error.w" as httpError;

struct User {
  id: str;
  displayName: str;
  username: str;
  avatarUrl: str;
}

struct CreateOptions {
  displayName: str;
  username: str;
  avatarUrl: str?;
}

struct FromLoginOptions {
  username: str;
}

struct GetOrCreateOptions {
  displayName: str;
  username: str;
  avatarUrl: str?;
}

struct GetUsernameOptions {
  userId: str;
}

pub class Users {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateOptions): User {
    let userId = "user_{Nanoid62.Nanoid62.generate()}";
    log("userId = {userId}");

    this.table.transactWriteItems(
      transactItems: [
        {
          put: {
            item: {
              pk: "LOGIN#{options.username}",
              sk: "#",
              id: userId,
              displayName: options.displayName,
              username: options.username,
              avatarUrl: options.avatarUrl,
            },
            conditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          put: {
            item: {
              pk: "USER#{userId}",
              sk: "#",
              id: userId,
              displayName: options.displayName,
              username: options.username,
              avatarUrl: options.avatarUrl,
            },
          }
        }
      ],
    );

    return User {
      id: userId,
      displayName: options.displayName,
      username: options.username,
      avatarUrl: options.avatarUrl ?? "",
    };
  }

  pub inflight fromLogin(options: FromLoginOptions): User? {
    let result = this.table.getItem(
      key: {
        pk: "LOGIN#{options.username}",
        sk: "#",
      },
    );

    return User.fromJson(result.item);
  }

  pub inflight getOrCreate(options: GetOrCreateOptions): User {
    let user = this.fromLogin(username: options.username);

    return user ?? this.create(
      displayName: options.displayName,
      username: options.username,
      avatarUrl: options.avatarUrl
    );
  }

  pub inflight get(options: GetUsernameOptions): User {
    let result = this.table.getItem(
      key: {
        pk: "USER#{options.userId}",
        sk: "#",
      },
      projectionExpression: "id, displayName, username, avatarUrl",
    );

    if let user = User.tryFromJson(result.item) {
      return user;
    } else {
      throw httpError.HttpError.throwNotFound("User not found");
    }
  }
}
