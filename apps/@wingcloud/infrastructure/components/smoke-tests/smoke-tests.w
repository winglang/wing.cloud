bring http;
bring aws;
bring expect;
bring "@winglibs/checks" as checks;
bring "../parameter/parameter.w" as parameter;

// not working for smoke tests right now
// see https://github.com/winglang/wing/issues/5205
// https://github.com/winglang/wing/issues/5204

pub struct SmokeTestsProps {
  baseUrl: parameter.Parameter;
  path: str;
}

pub class SmokeTests {
  new(props: SmokeTestsProps) {
    let check = new checks.Check(inflight () => {
      let url = "{props.baseUrl.get()}{props.path}";
      expect.equal(200, http.get(url).status);
    });
  }
}
