bring util;
bring ex;
bring "../crypto.w" as crypto;
bring "../secrets.w" as Secrets;

let appSecret = util.env("APP_SECRET");
let table = new ex.DynamodbTable(
  name: "data",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
);

let secrets = new Secrets.Secrets(table, appSecret);

test "can securely store sensitive data" {
  let secret = secrets.create(appId: "app-id", name: "test-secret", value: "secret-value");
  let storedSecret = secrets.get(id: secret.id);
  let item = table.getItem(key: {
    pk: "SECRET#${secret.id}",
    sk: "#",
  });
  let encryptedData = crypto.EncryptedData.fromJson(item.item?.get("value"));
  let value = crypto.decrypt(appSecret, encryptedData);
  
  assert(secret.value == value);
  assert(storedSecret.value == value);
}

test "can store and list secrets" {
  let secret1 = secrets.create(appId: "app-id", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", name: "test-secret-2", value: "secret-value-2");
  let storedSecret = secrets.get(id: secret1.id);
  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    name: "test-secret",
    value: "secret-value",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
    environmentId: nil
  };
  let expected2 = Secrets.Secret{
    id: secret2.id,
    appId: "app-id",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret2.createdAt,
    updatedAt: secret2.updatedAt,
    environmentId: nil
  };
  
  assert(storedSecret == expected1);

  let storedSecrets = secrets.list(appId: "app-id");
  assert(storedSecrets.length == 2);
  for secret in storedSecrets {
    if secret.id == secret1.id {
      assert(secret == expected1);
    } elif secret.id == secret2.id {
      assert(secret == expected2);
    } else {
      assert(false);
    }
  }
}
