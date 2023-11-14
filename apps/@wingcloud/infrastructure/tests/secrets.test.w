bring util;
bring ex;
bring "../crypto/icrypto.w" as icrypto;
bring "../crypto/crypto.w" as crypto;
bring "../secrets.w" as Secrets;

let table = new ex.DynamodbTable(
  name: "data",
  attributeDefinitions: {
    "pk": "S",
    "sk": "S",
  },
  hashKey: "pk",
  rangeKey: "sk",
);

let secrets = new Secrets.Secrets(table);

test "not storing sensitive data" {
  let secret = secrets.create(appId: "app-id", name: "test-secret", value: "secret-value");
  let item = table.getItem(key: {
    pk: "APP#${secret.appId}",
    sk: "TYPE#global#ENVIRONMENT#global#SECRET#${secret.id}",
  });
  let encryptedData = icrypto.EncryptedData.fromJson(item.item?.get("value"));

  assert(secret.value != encryptedData.data.text);
}

test "can store and get a secret" {
  let secret1 = secrets.create(appId: "app-id", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret-2", value: "secret-value-2");
  let secret3 = secrets.create(appId: "app-id", environmentType: "production", environmentId: "env-id", name: "test-secret-3", value: "secret-value-3");
  let storedSecret1 = secrets.get(appId: "app-id", id: secret1.id);
  let storedSecret2 = secrets.get(appId: "app-id", environmentType: "production", id: secret2.id);
  let storedSecret3 = secrets.get(appId: "app-id", environmentType: "production", environmentId: "env-id", id: secret3.id);

  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    name: "test-secret",
    value: "secret-value",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
    environmentType: nil,
    environmentId: nil
  };
  let expected2 = Secrets.Secret{
    id: secret2.id,
    appId: "app-id",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret2.createdAt,
    updatedAt: secret2.updatedAt,
    environmentType: "production",
    environmentId: nil,
  };
  let expected3 = Secrets.Secret{
    id: secret3.id,
    appId: "app-id",
    name: "test-secret-3",
    value: "secret-value-3",
    createdAt: secret3.createdAt,
    updatedAt: secret3.updatedAt,
    environmentType: "production",
    environmentId: "env-id",
  };
  
  assert(storedSecret1 == expected1);
  assert(storedSecret2 == expected2);
  assert(storedSecret3 == expected3);
}

test "can list secrets without merging" {
  let secret1 = secrets.create(appId: "app-id", environmentType: "preview", environmentId: "env-id", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", environmentType: "preview", environmentId: "env-id", name: "test-secret-2", value: "secret-value-2");
  let secret3 = secrets.create(appId: "app-id", environmentType: "production", environmentId: "env-id-2", name: "test-secret-3", value: "secret-value-3");
  let secret4 = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret-3", value: "secret-value-3");
  let secret5 = secrets.create(appId: "app-id", name: "test-secret-4", value: "secret-value-4");
  let secret6 = secrets.create(appId: "app-id-2", name: "test-secret-4", value: "secret-value-4");
  
  let expected1 = Secrets.Secret{
    id: secret1.id,
    appId: "app-id",
    environmentType: "preview",
    environmentId: "env-id",
    name: "test-secret",
    value: "secret-value",
    createdAt: secret1.createdAt,
    updatedAt: secret1.updatedAt,
  };
  let expected2 = Secrets.Secret{
    id: secret2.id,
    appId: "app-id",
    environmentType: "preview",
    environmentId: "env-id",
    name: "test-secret-2",
    value: "secret-value-2",
    createdAt: secret2.createdAt,
    updatedAt: secret2.updatedAt,
  };
  
  // with envType and envId
  let storedSecrets = secrets.list(appId: "app-id", environmentType: "preview", environmentId: "env-id");
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

  // with envType
  let storedSecrets2 = secrets.list(appId: "app-id", environmentType: "production");
  assert(storedSecrets2.length == 1);

  // only appId
  let storedSecrets3 = secrets.list(appId: "app-id");
  assert(storedSecrets3.length == 1);
}

test "can list secrets with merging" {
  let secret1 = secrets.create(appId: "app-id", environmentType: "preview", environmentId: "env-id", name: "test-secret", value: "secret-value");
  let secret2 = secrets.create(appId: "app-id", environmentType: "preview", name: "test-secret-2", value: "secret-value-2");
  let secret3 = secrets.create(appId: "app-id", environmentType: "production", environmentId: "env-id-2", name: "test-secret-3", value: "secret-value-3");
  let secret4 = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret-4", value: "secret-value-4");
  let secret5 = secrets.create(appId: "app-id", environmentType: "production", name: "test-secret-3", value: "secret-value-5");
  let secret6 = secrets.create(appId: "app-id", name: "test-secret-6", value: "secret-value-6");
  let secret7 = secrets.create(appId: "app-id-2", name: "test-secret-7", value: "secret-value-7");
  
  // with envType and envId
  let storedSecrets = secrets.list(mergeAllSecrets: true, appId: "app-id", environmentType: "preview", environmentId: "env-id");
  assert(storedSecrets.length == 3);
  for secret in storedSecrets {
    assert(secret.id == secret1.id || secret.id == secret2.id || secret.id == secret6.id);
  }

  // with envType 
  let storedSecrets2 = secrets.list(mergeAllSecrets: true, appId: "app-id", environmentType: "production");
  assert(storedSecrets.length == 3);
  for secret in storedSecrets2 {
    assert(secret.id == secret4.id || secret.id == secret5.id || secret.id == secret6.id);
  }

  // with overriding 
  let storedSecrets3 = secrets.list(mergeAllSecrets: true, appId: "app-id", environmentType: "production", environmentId: "env-id-2");
  assert(storedSecrets3.length == 3);
  for secret in storedSecrets3 {
    assert(secret.id == secret3.id || secret.id == secret4.id || secret.id == secret6.id);
  }
}
