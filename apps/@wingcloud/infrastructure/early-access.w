bring ex;
bring "./nanoid62.w" as Nanoid62;
bring "./http-error.w" as httpError;

pub struct EarlyAccessItem {
  id: str;
  email: str;
  code: str;
  createdAt: str;
  expiresAt: str;
  used: bool;
}

struct CreateOptions {
  expirationTime: num; // in milliseconds
  email: str;
  code: str;
}

struct GetOptions {
  email: str;
}

struct DeleteOptions {
  email: str;
}

class Util {
  extern "./util.js" pub static inflight addMiliseconds(date:str, ms: num): str;
}

pub class EarlyAccess {
  table: ex.DynamodbTable;

  new(table: ex.DynamodbTable) {
    this.table = table;
  }

  pub inflight create(options: CreateOptions): EarlyAccessItem {
    let id = "early_access_{Nanoid62.Nanoid62.generate()}";

    let createdAt = datetime.utcNow().toIso();

    let expiresAt = Util.addMiliseconds(createdAt, options.expirationTime);

    try {
      this.table.transactWriteItems(transactItems: [
        {
          put: {
            item: Json.deepCopy({
              pk: "EARLY_ACCESS#{options.email}",
              sk: "#",
              id: id,
              email: options.email,
              code: options.code,
              createdAt: createdAt,
              expiresAt: expiresAt,
              used: false,
            }),
            conditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
          },
        },
      ]);
    } catch error {
      if error.contains("ConditionalCheckFailed") {
        throw httpError.HttpError.forbidden("Email '{options.email}' already has an early access code");
      } else {
        throw httpError.HttpError.error(error);
      }
    }
    return EarlyAccessItem {
      id: id,
      email: options.email,
      code: options.code,
      createdAt: createdAt,
      expiresAt: "",
      used: false,
    };
  }

  pub inflight get(options: GetOptions): EarlyAccessItem {
    let result = this.table.getItem(
      key: {
        pk: "EARLY_ACCESS#{options.email}",
        sk: "#",
      },
      projectionExpression: "id, email, code, createdAt, expiresAt, used",
    );

    if let user = EarlyAccessItem.tryFromJson(result.item) {
      return user;
    } else {
      throw httpError.HttpError.notFound("User not found");
    }
  }

  pub inflight delete(options: DeleteOptions) {
    this.table.deleteItem(
      key: {
        pk: "EARLY_ACCESS#{options.email}",
        sk: "#",
      },
    );
  }

  pub inflight list(): Array<EarlyAccessItem> {
    let result = this.table.scan(
      filterExpression: "begins_with(pk, :prefix)",
      expressionAttributeValues: {
        ":prefix": "EARLY_ACCESS#",
      },
    );

    let var users = MutArray<EarlyAccessItem>[];

    for item in result.items {
      users.push(EarlyAccessItem.fromJson(item));
    }

    return users.copy();
  }
}
