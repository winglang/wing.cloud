bring http;
bring expect;
bring "@winglibs/checks" as checks;
bring "../parameter/parameter.w" as parameter;

pub struct SmokeTestsProps {
  baseUrl: parameter.Parameter;
  path: str;
}

pub class SmokeTests {
  new(props: SmokeTestsProps) {
    new checks.Check(inflight () => {
      let url = "{props.baseUrl.get()}{props.path}";
      expect.equal(200, http.get(url).status);
    });
  }
}
