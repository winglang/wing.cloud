bring ex;
bring "./crypto/crypto.w" as crypto;
bring "./crypto/icrypto.w" as icrypto;

pub struct Secret {
  id: str;
  appId: str;
  environmentType: str;
  name: str;
  value: str;
  createdAt: str;
  updatedAt: str;
}

struct Item extends Secret {
  pk: str;
  sk: str;
}

pub struct CreateSecretOptions {
  appId: str;
  environmentType: str;
  name: str;
  value: str;
}

pub struct GetSecretOptions {
  id: str;
  appId: str;
  environmentType: str;
  decryptValue: bool?;
}

pub struct ListSecretsOptions {
  appId: str;
  environmentType: str;
  decryptValues: bool?;
}

pub struct DeleteSecretOptions {
  id: str;
  appId: str;
  environmentType: str;
}

pub class Secrets {
  pub table: ex.DynamodbTable;
  crypto: crypto.Crypto;

  new() {
    this.table = new ex.DynamodbTable(
      name: "secrets",
      attributeDefinitions: {
        "pk": "S",
        "sk": "S",
      },
      hashKey: "pk",
      rangeKey: "sk",
    );
    this.crypto = new crypto.Crypto();
  }

  pub inflight create(options: CreateSecretOptions): Secret {
    let createdAt = datetime.utcNow().toIso();
    let secret = Secret {
      id: options.name,
      appId: options.appId,
      environmentType: options.environmentType,
      name: options.name,
      value: options.value,
      createdAt: createdAt,
      updatedAt: createdAt,
    };

    let item = MutJson {
      pk: "APP#${secret.appId}",
      sk: "SECRET#TYPE#${secret.environmentType}#SECRET#${secret.id}",
      id: secret.id,
      appId: secret.appId,
      environmentType: secret.environmentType,
      name: secret.name,
      value: this.crypto.encrypt(secret.value),
      createdAt: createdAt,
      updatedAt: createdAt,
    };

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
    let result = this.table.getItem(
      key: {
        pk: "APP#${options.appId}",
        sk: "SECRET#TYPE#${options.environmentType}#SECRET#${options.id}",
      },
    );

    if let item = result.item {
      return Secret.fromJson(this.fromDB(item, options.decryptValue ?? false));
    }

    throw "Secret [${options.id}] not found";
  }

  pub inflight list(options: ListSecretsOptions): Array<Secret> {
    let var secrets = MutArray<Secret>[];

    let result = this.table.query(
      keyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
      expressionAttributeValues: {
        ":pk": "APP#${options.appId}",
        ":sk": "SECRET#TYPE#${options.environmentType}#"
      },
    );

    for item in result.items {
      let secret = Secret.fromJson(this.fromDB(item, options.decryptValues ?? false));
      secrets.push(secret);
    }

    return secrets.copy();
  }

  pub inflight delete(options: DeleteSecretOptions) {
    let var secrets = MutArray<Secret>[];

    // make sure secret exists
    let item = this.get(id: options.id, appId: options.appId, environmentType: options.environmentType);

    let res = this.table.deleteItem(key: {
      pk: "APP#${item.appId}",
      sk: "SECRET#TYPE#${item.environmentType}#SECRET#${item.id}",
    });
  }

  inflight fromDB(item: Json, decryptValue: bool): Secret {
    let temp = MutJson{
      id: item.get("id").asStr(),
      appId: item.get("appId").asStr(),
      environmentType: item.get("environmentType").asStr(),
      name: item.get("name").asStr(),
      createdAt: item.get("createdAt").asStr(),
      updatedAt: item.get("updatedAt").asStr(),
    };

    if decryptValue {
      temp.set("value", this.crypto.decrypt(icrypto.EncryptedData.fromJson(item.get("value"))));
    } else {
      temp.set("value", "***");
    }
    
    return Secret.fromJson(temp);
  }
}
