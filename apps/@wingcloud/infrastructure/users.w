bring ex;
bring "./nanoid62.w" as Nanoid62;

struct User {
  id: str;
  name: str;
  username: str;
  avatarUrl: str;
}

struct CreateOptions {
  name: str;
  username: str;
  avatarUrl: str?;
}

struct FromLoginOptions {
  username: str;
}

struct GetOrCreateOptions {
  name: str;
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
    let userId = "user_${Nanoid62.Nanoid62.generate()}";
    log("userId = ${userId}");

    this.table.transactWriteItems(
      transactItems: [
        {
          put: {
            item: {
              pk: "LOGIN#${options.username}",
              sk: "#",
              id: userId,
              name: options.name,
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
              name: options.name,
              username: options.username,
              avatarUrl: options.avatarUrl,
            },
          }
        }
      ],
    );

    return User {
      id: userId,
      name: options.name,
      username: options.username,
      avatarUrl: options.avatarUrl ?? "",
    };
  }

  pub inflight fromLogin(options: FromLoginOptions): User? {
    let result = this.table.getItem(
      key: {
        pk: "LOGIN#${options.username}",
        sk: "#",
      },
    );

    return User.fromJson(result.item);
  }

  pub inflight getOrCreate(options: GetOrCreateOptions): User {
    let user = this.fromLogin(username: options.username);

    return user ?? this.create(
      name: options.name,
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
    );

    if let user = User.tryFromJson(result.item) {
      return user;
    } else {
      throw "User not found";
    }
  }
}
