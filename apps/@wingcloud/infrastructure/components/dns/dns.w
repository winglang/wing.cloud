bring util;
bring "./idns.w" as idns;
bring "./dns.sim.w" as sim;
bring "./dns.aws.w" as aws;

pub struct DNSProps {
  token: str;
}

pub class DNS impl idns.IDNS {
  inner: idns.IDNS;
  new(props: DNSProps) {
    if util.env("WING_TARGET") == "sim" {
      this.inner = new sim.DNS();
    } else {
      this.inner = new aws.DNS(token: props.token);
    }
  }

  pub inflight createRecords(records: Array<idns.Record>) {
    this.inner.createRecords(records);
  }

  pub inflight deleteRecords(records: Array<idns.Record>) {
    this.inner.deleteRecords(records);
  }
}
