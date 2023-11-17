bring cloud;

pub interface IParameter {
  inflight get(): str;
}

pub struct ParameterProps {
  name: str;
  value: str;
}