pub struct Record {
  zone: str;
  name: str;
  type: str;
  content: str;
}

pub inflight interface IDNS {
  inflight createRecords(records: Array<Record>): void;
  inflight deleteRecords(records: Array<Record>): void;
}
