bring ex;
bring "./nanoid62.w" as nanoid62;
bring "./crypto/crypto.w" as crypto;
bring "./crypto/icrypto.w" as icrypto;

pub struct Secret {
  id: str;
  appId: str;
  name: str;
  value: str;
  createdAt: str;
  updatedAt: str;
  environmentType: str?;
  environmentId: str?;
}

struct Item extends Secret {
  pk: str;
  sk: str;
}

pub struct CreateSecretOptions {
  appId: str;
  name: str;
  value: str;
  environmentType: str?;
  environmentId: str?;
}

pub struct GetSecretOptions {
  id: str;
  appId: str;
  environmentType: str?;
  environmentId: str?;
}

pub struct ListSecretsOptions {
  appId: str;
  environmentType: str?;
  environmentId: str?;
  mergeAllSecrets: bool?;
}

pub struct ListSecretsByEnvironmentOptions {
  environmentId: str;
}

pub class Secrets {
  table: ex.DynamodbTable;
  crypto: crypto.Crypto;
  global: str;

  new(table: ex.DynamodbTable) {
    this.table = table;
    this.crypto = new crypto.Crypto();
    this.global = "global";
  }

  pub inflight create(options: CreateSecretOptions): Secret {
    let createdAt = datetime.utcNow().toIso();
    let secret = Secret {
      id: "secret_${nanoid62.Nanoid62.generate()}",
      appId: options.appId,
      name: options.name,
      value: options.value,
      createdAt: createdAt,
      updatedAt: createdAt,
      environmentType: options.environmentType,
      environmentId: options.environmentId,
    };

    let item = MutJson {
      pk: "APP#${secret.appId}",
      sk: "TYPE#${secret.environmentType ?? this.global}#ENVIRONMENT#${secret.environmentId ?? this.global}#SECRET#${secret.id}",
      id: secret.id,
      appId: secret.appId,
      name: secret.name,
      value: this.crypto.encrypt(secret.value),
      createdAt: createdAt,
      updatedAt: createdAt,
    };

    if let environmentType = secret.environmentType {
      item.set("environmentType", environmentType);
    }

    if let environmentId = secret.environmentId {
      if !secret.environmentType? {
        throw "environment type must be provided when specifing environment id";
      }

      item.set("environmentId", environmentId);
    }

    this.table.transactWriteItems(transactItems: [
      {
        put: {
          item: Json.deepCopy(item),
          conditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
        },
      },
    ]);

    return secret;
  }

  pub inflight get(options: GetSecretOptions): Secret {
    if let environmentId = options.environmentId {
      if !options.environmentType? {
        throw "environment type must be provided when specifing environment id";
      }
    }

    let environmentType = options.environmentType ?? this.global;
    let environmentId = options.environmentId ?? this.global;

    let result = this.table.getItem(
      key: {
        pk: "APP#${options.appId}",
        sk: "TYPE#${environmentType}#ENVIRONMENT#${environmentId}#SECRET#${options.id}",
      },
    );

    if let item = result.item {
      return Secret.fromJson(this.fromDB(item));
    }

    throw "Secret [${options.id}] not found";
  }

  pub inflight list(options: ListSecretsOptions): Array<Secret> {
    if let environmentId = options.environmentId {
      if !options.environmentType? {
        throw "environment type must be provided when specifing environment id";
      }
    }
  
    let var items = Array<Json>[];
    let mergeAllSecrets = options.mergeAllSecrets ?? false;
    if !mergeAllSecrets {
      let result = this.table.query(
        keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        expressionAttributeValues: {
          ":pk": "APP#${options.appId}",
          ":sk": "TYPE#${options.environmentType ?? this.global}#ENVIRONMENT#${options.environmentId ?? this.global}#"
        },
      );
      items = items.concat(result.items);
    } else {
      // fetch everything that belongs to the app
      let result = this.table.query(
        keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        expressionAttributeValues: {
          ":pk": "APP#${options.appId}",
          ":sk": "TYPE#${this.global}#ENVIRONMENT#${this.global}#"
        },
      );
      items = items.concat(result.items);

      if let environmentType = options.environmentType {
        // fetch everything that belongs to those app and environment type
        let result = this.table.query(
          keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
          expressionAttributeValues: {
            ":pk": "APP#${options.appId}",
            ":sk": "TYPE#${environmentType}#ENVIRONMENT#${this.global}#"
          },
        );
        items = items.concat(result.items);

        if let environmentId = options.environmentId {
          // fetch everything that belongs to those app, environment type and environment id
          let result = this.table.query(
            keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
            expressionAttributeValues: {
              ":pk": "APP#${options.appId}",
              ":sk": "TYPE#${environmentType}#ENVIRONMENT#${environmentId}#"
            },
          );
          items = items.concat(result.items);
        }
      }
    }

    let var secrets: MutMap<Secret> = {};
    for item in items {
      let secret = Secret.fromJson(this.fromDB(item));
      let secretName = secret.name;
      // override the current secret if exists since items at the end of the array are more specific
      secrets.set(secretName, secret);
    }

    return secrets.values();
  }

  inflight fromDB(item: Json): Secret {
    let temp = MutJson{
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      name: item.get("name").asStr(),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
      environmentType: item.tryGet("environmentType")?.tryAsStr(),
      environmentId: item.tryGet("environmentId")?.tryAsStr(),
    };

    temp.set("value", this.crypto.decrypt(icrypto.EncryptedData.fromJson(item.get("value"))));
    
    return Secret.fromJson(temp);
  }
}
