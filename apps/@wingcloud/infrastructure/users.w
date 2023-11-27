bring ex;
bring "./nanoid62.w" as Nanoid62;

struct User {
  id: str;
  username: str;
  avatar_url: str;
}

struct CreateOptions {
  username: str;
  avatar_url: str?;
}

struct FromLoginOptions {
  username: str;
}

struct GetOrCreateOptions {
  username: str;
  avatar_url: str?;
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
              username: options.username,
              avatar_url: options.avatar_url,
            },
          }
        }
      ],
    );

    return User {
      id: userId,
      username: options.username,
      avatar_url: options.avatar_url ?? "",
    };
  }

  pub inflight fromLogin(options: FromLoginOptions): User? {
    let result = this.table.getItem(
      key: {
        pk: "LOGIN#${options.username}",
        sk: "#",
      },
    );

    return User.tryFromJson(result.item);
  }

  pub inflight getOrCreate(options: GetOrCreateOptions): User {
    let user = this.fromLogin(username: options.username);

    return user ?? this.create(
      username: options.username,
      avatar_url: options.avatar_url
    );
  }

  pub inflight get(options: GetUsernameOptions): User {
    let result = this.table.getItem(
      key: {
        pk: "USER#${options.userId}",
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
