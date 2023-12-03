bring "./idns.w" as idns;

class Util {
  extern "./dnsimple.mts" pub static inflight createRecords(token: str, records: Array<idns.Record>);
  extern "./dnsimple.mts" pub static inflight deleteRecords(token: str, records: Array<idns.Record>);
}

struct DNSProps {
  token: str;
}

pub class DNS impl idns.IDNS {
  token: str;
  new(props: DNSProps) {
    this.token = props.token;
  }

  pub inflight createRecords(records: Array<idns.Record>) {
    Util.createRecords(this.token, records);
  }

  pub inflight deleteRecords(records: Array<idns.Record>) {
    Util.deleteRecords(this.token, records);
  }
}
