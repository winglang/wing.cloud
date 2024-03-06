bring ex;

pub class MakeTable {
  table: ex.DynamodbTable;
  new(name: str?) {
    this.table = new ex.DynamodbTable(
      name: name ?? "data",
      attributeDefinitions: {
        "pk": "S",
        "sk": "S",
      },
      hashKey: "pk",
      rangeKey: "sk",
    );
  }

  pub get(): ex.DynamodbTable {
    return this.table;
  }
}
