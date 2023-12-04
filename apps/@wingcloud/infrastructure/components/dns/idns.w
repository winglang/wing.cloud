pub struct Record {
  zone: str;
  name: str;
  type: str;
  content: str;
}

pub interface IDNS {
  inflight createRecords(records: Array<Record>);
  inflight deleteRecords(records: Array<Record>);
}
