pub struct TestResult {
  path: str;
  pass: bool;
}

pub struct TestResults {
  testResults: Array<TestResult>;
}

pub struct StatusReport {
  environmentId: str;
  status: str;
  data: Json?;
}
