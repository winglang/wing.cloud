bring "./environments.w" as environments;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;
bring "./types/octokit-types.w" as octokit;

struct GithubCommentProps {
  environments: environments.Environments;
  apps: apps.Apps;
  siteDomain: str;
}

struct GithubCommentCreateProps {
  octokit: octokit.OctoKit;
  prNumber: num;
  repo: str;
}

pub class GithubComment {
  environments: environments.Environments;
  apps: apps.Apps;
  siteDomain: str;

  new(props: GithubCommentProps) {
    this.environments = props.environments;
    this.apps = props.apps;
    this.siteDomain = props.siteDomain;
  }

  inflight envStatusToString(status: str, repoOwner: str, appName: str, branch: str): str {
    let inspect = "<a target=\"_blank\" href=\"${this.siteDomain}/${repoOwner}/${appName}/${branch}\">Inspect</a>";
    if status == "tests" {
      return "Running Tests";
    }
    if status == "running" {
      return "✅ Ready (${inspect})";
    }
    if status == "error" {
      return "❌ Failed (${inspect})";
    }
    return status.at(0).uppercase() + status.substring(1);
  }

  pub inflight createOrUpdate(props: GithubCommentCreateProps): num {
    let var commentId: num? = nil;
    let tableHeader = "<tr><th>App</th><th>Status</th><th>Preview</th><th>Updated (UTC)</th></tr>";
    let var commentBody = "<table>${tableHeader}";
    for app in this.apps.listByRepository(repository: props.repo) {
      for environment in this.environments.list(appId: app.appId) {
        if environment.repo == props.repo && environment.prNumber == props.prNumber {
          let var testRows = "";
          if let testResults = environment.testResults {
            let var i = 0;
            for testResult in testResults.testResults {
              let var testRes = "✅ Passed";
              if !testResult.pass {
                testRes = "❌ Failed";
              }
              let testId = testResult.id;
              let testName = testResult.path.split(":").at(-1);
              let testResourcePath = testResult.path.split(":").at(0);
              let link = "<a target=\"_blank\" href=\"${this.siteDomain}/${app.repoOwner}/${app.appName}/${environment.branch}/#${testId}\">View</a>";
              testRows = "${testRows}<tr><td>${testName}</td><td>${testResourcePath}</td><td>${testRes}</td><td>${link}</td></tr>";
              i += 1;
            }
          }

          let var previewUrl = "";
          let shouldDisplayUrl = environment.status == "running";
          if(shouldDisplayUrl) {
            previewUrl = "<a target=\"_blank\" href=\"${this.siteDomain}/${app.repoOwner}/${app.appName}/${environment.branch}/console\">Visit Preview</a>";
          }

          let appNameLink = "<a target=\"_blank\" href=\"${this.siteDomain}/${app.repoOwner}/${app.appName}\">${app.appName}</a>";

          let date = std.Datetime.utcNow();
          let dateStr = "${date.dayOfMonth}-${date.month}-${date.year} ${date.hours}:${date.min} (UTC)";
          let tableRows = "<tr><td>${appNameLink}</td><td>${this.envStatusToString(environment.status, app.repoOwner, app.appName, environment.branch)}</td><td>${previewUrl}</td><td>${dateStr}</td></tr>";
          let testsSection = "<details><summary>Tests</summary><br><table><tr><th>Test</th><th>Resource Path</th><th>Result</th><th>Logs</th></tr>${testRows}</table></details>";

          commentBody = "${commentBody}${tableRows}</table>";

          if testRows != "" {
            commentBody = "${commentBody}<br>${testsSection}";
          }

          if !commentId? && environment.commentId? {
            commentId = environment.commentId;
          }
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
