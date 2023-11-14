bring cloud;
bring "constructs" as constructs;
bring "./iparameter.w" as i;

pub class Parameter impl i.IParameter {
  state: cloud.Bucket;
  key: str;

  new(props: i.ParameterProps) {
    this.state = new cloud.Bucket();
    this.key = "/config/${props.name}";
    this.state.addObject(this.key, props.value);
  }

  pub inflight get(): str {
    return this.state.get(this.key);
  }
}