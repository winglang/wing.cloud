pub struct TestResult {
  id: str;
  path: str;
  pass: bool;
}

pub struct TestResults {
  testResults: Array<TestResult>;
}

pub struct Endpoint {
  path: str;
  type: str;
  url: str;
  port: num;
  digest: str;
}

pub struct Objects {
  endpoints: Array<Endpoint>;
}

pub struct Running {
  objects: Objects;
}

pub struct StatusReport {
  environmentId: str;
  status: str;
  data: Json?;
}
