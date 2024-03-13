bring util;
bring "./idns.w" as idns;
bring "./dns.sim.w" as sim;
bring "./dns.aws.w" as aws;

pub struct DNSProps {
  token: str?;
}

pub class DNS impl idns.IDNS {
  inner: idns.IDNS;
  new(props: DNSProps) {
    if util.env("WING_TARGET") == "sim" || util.tryEnv("WING_IS_TEST") == "true"  {
      this.inner = new sim.DNS();
    } else {
      if let token = props.token {
        this.inner = new aws.DNS(token: token);
      } else {
        throw "new dns: missing token parameter";
      }
    }
  }

  pub inflight createRecords(records: Array<idns.Record>) {
    this.inner.createRecords(records);
  }

  pub inflight deleteRecords(records: Array<idns.Record>) {
    this.inner.deleteRecords(records);
  }
}
