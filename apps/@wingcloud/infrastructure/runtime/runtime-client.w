bring http;
bring "../apps.w" as apps;
bring "../environments.w" as environments;
bring "./runtime.w" as runtime;
bring "../components/certificate/icertificate.w" as certificate;

struct RuntimeClientProps {
  runtimeUrl: str;
}

struct RuntimeClientCreateOptions {
  appId: str;
  entrypoint: str;
  environment: environments.Environment;
  secrets: Map<str>;
  certificate: certificate.Certificate;
  token: str;
  sha: str;
}

struct RuntimeClientDeleteOptions {
  environment: environments.Environment;
}

pub class RuntimeClient {
  runtimeUrl: str;

  new(props: RuntimeClientProps) {
    this.runtimeUrl = props.runtimeUrl;
  }

  pub inflight create(options: RuntimeClientCreateOptions) {
    let res = http.post(this.runtimeUrl, body: Json.stringify(runtime.Message {
      repo: options.environment.repo,
      sha: options.sha,
      entrypoint: options.entrypoint,
      appId: options.appId,
      environmentId: options.environment.id,
      token: options.token,
      secrets: options.secrets,
      certificate: options.certificate,
    }));

    if !res.ok {
      throw "runtime client: create error {res.body}";
    }
  }

  pub inflight delete(options: RuntimeClientDeleteOptions) {
    let res = http.delete(this.runtimeUrl, body: Json.stringify({
      environmentId: options.environment.id,
    }));

    if !res.ok {
      throw "runtime client: delete error {res.body}";
    }
  }
}
