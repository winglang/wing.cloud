bring "./environments.w" as environments;
bring "./endpoints.w" as endpoints;
bring "./users.w" as users;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;
bring "./types/octokit-types.w" as octokit;

struct GithubCommentProps {
  environments: environments.Environments;
  endpoints: endpoints.Endpoints;
  users: users.Users;
  apps: apps.Apps;
  siteDomain: str;
}

struct GithubCommentCreateProps {
  octokit: octokit.OctoKit;
  prNumber: num;
  repo: str;
  appId: str;
  appName: str;
  appFullName: str?;
}

struct GithubCommentUpdateRepoProps {
  octokit: octokit.OctoKit;
  appId: str;
  appName: str;
  environmentId: str;
}

pub class GithubComment {
  environments: environments.Environments;
  endpoints: endpoints.Endpoints;
  users: users.Users;
  apps: apps.Apps;
  siteDomain: str;

  new(props: GithubCommentProps) {
    this.environments = props.environments;
    this.endpoints = props.endpoints;
    this.users = props.users;
    this.apps = props.apps;
    this.siteDomain = props.siteDomain;
  }

  inflight envStatusToString(status: str, fullAppName: str, branch: str): str {
    let inspect = "<a target=\"_blank\" href=\"{this.siteDomain}/{fullAppName}/environment/{branch}\">Inspect</a>";
    if status == "running-server" {
      return "Starting App";
    }
    if status == "running-tests" {
      return "Running Tests";
    }
    if status == "running" {
      return "✅ Ready ({inspect})";
    }
    if status == "error" {
      return "❌ Failed ({inspect})";
    }
    if status == "initializing" {
      return "Deploying";
    }
    return status.at(0).uppercase() + status.substring(1);
  }

  pub inflight getAppOwner(appId: str): str? {
    try {
      let app = this.apps.get(appId: appId);
      return (this.users.get(userId: app.userId)).username;
    } catch {
      return nil;
    }
  }

  pub inflight createOrUpdate(props: GithubCommentCreateProps): num {
    let var commentId: num? = nil;
    let tableHeader = "<tr><th>App</th><th>Status</th><th>Console</th><th>Endpoints</th><th>Updated (UTC)</th></tr>";
    let var commentBody = "<table>{tableHeader}";

    let var fullAppName = props.appFullName;
    if !fullAppName? {
      if let appOwner = this.getAppOwner(props.appId) {
        fullAppName = "${appOwner}/${props.appName}";
      }
    }

    for environment in this.environments.list(appId: props.appId) {
      if environment.repo == props.repo && environment.prNumber == props.prNumber {
        let var testRows = "";
        let var passedTests = 0;
        let var failedTests = 0;
        if environment.status == "running" || environment.status == "running-server" {
          if let testResults = environment.testResults {
            let var i = 0;
            for testResult in testResults.testResults {
              let var testRes = "";
              if !testResult.pass {
                testRes = "❌ Failed";
                failedTests += 1;
              } else {
                testRes = "✅ Passed";
                passedTests += 1;
              }

              let testId = testResult.id;
              let pathParts = testResult.path.split(":");
              let testName = pathParts.at(pathParts.length - 1);
              let testResourcePath = pathParts.at(0);
              let var link = "";
              if environment.status == "running" && fullAppName? {
                link = "<a target=\"_blank\" href=\"{this.siteDomain}/{fullAppName}/tests/{environment.branch}?testId={testId}\">Logs</a>";
              }
              testRows = "{testRows}<tr><td>{testName}</td><td>{testResourcePath}</td><td>{testRes}</td><td>{link}</td></tr>";
              i += 1;
            }
          }
        }

        let var previewUrl = "";
        let var appNameLink = props.appName;

        if fullAppName? {
          appNameLink = "<a target=\"_blank\" href=\"{this.siteDomain}/{fullAppName}\">{props.appFullName ?? props.appName}</a>";
          if environment.status == "running" {
            previewUrl = "<a target=\"_blank\" href=\"{this.siteDomain}/{fullAppName}/console/{environment.branch}/\">Visit</a>";
          }
        }

        let var endpointsString = "";
        if environment.status == "running" {
          for endpoint in this.endpoints.list(environmentId: environment.id) {
            let var endpointText = endpoint.label;
            let var endpointIcon = "🔗";
            if endpoint.browserSupport {
              endpointIcon = "🌐";
            }
            endpointText = "{endpointIcon} <a target=\"_blank\" href=\"{endpoint.publicUrl}\">{endpoint.label}</a>";
            endpointsString = "{endpointText}<br> {endpointsString}";
          }
        }

        let date = std.Datetime.utcNow();
        let dateStr = "{date.dayOfMonth}-{date.month}-{date.year} {date.hours}:{date.min} (UTC)";
        let envStatus = this.envStatusToString(environment.status, fullAppName ?? "", environment.branch);
        let tableRows = "<tr><td>{appNameLink}</td><td>{envStatus}</td><td>{previewUrl}</td><td>{endpointsString}</td><td>{dateStr}</td></tr>";
        let testSummary = "Tests: ✅ {passedTests} Passed  | ❌ {failedTests} Failed";
        let testsSection = "<details><summary>{testSummary}</summary><br><table><tr><th>Test</th><th>Resource Path</th><th>Result</th><th>Logs</th></tr>{testRows}</table></details>";

        commentBody = "{commentBody}{tableRows}</table>";

        if testRows != "" {
          commentBody = "{commentBody}<br>{testsSection}";
        }

        if !commentId? && environment.commentId? {
          commentId = environment.commentId;
        }
      }
    }

    let owner = props.repo.split("/").at(0);
    let repo = props.repo.split("/").at(1);
    if let commentId = commentId {
      props.octokit.issues.updateComment(owner: owner, repo: repo, comment_id: commentId, body: commentBody);
      return commentId;
    } else {
      let res = props.octokit.issues.createComment(owner: owner, repo: repo, issue_number: props.prNumber, body: commentBody);
      return res.data.id;
    }
  }
}
