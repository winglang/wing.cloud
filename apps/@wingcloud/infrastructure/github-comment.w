bring "./environments.w" as environments;
bring "./apps.w" as apps;
bring "./status-reports.w" as status_reports;
bring "./types/octokit-types.w" as octokit;

struct GithubCommentProps {
  environments: environments.Environments;
  apps: apps.Apps;
}

struct GithubCommentCreateProps {
  octokit: octokit.OctoKit;
  prNumber: num;
  repo: str;
}

pub class GithubComment {
  environments: environments.Environments;
  apps: apps.Apps;

  new(props: GithubCommentProps) {
    this.environments = props.environments;
    this.apps = props.apps;
  }

  inflight envStatusToString(status: str): str {
    if status == "tests" {
      return "Running Tests";
    }
    if status == "running" {
      return "✅ Ready";
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
              let var icon = "✅";
              if !testResult.pass {
                icon = "❌";
              }
              let testName = testResult.path.split(":").at(-1);
              let testResourcePath = testResult.path.split(":").at(0);
              testRows = "${testRows}<tr><td>${testName}</td><td>${testResourcePath}</td><td>${icon}</td></tr>";
              i += 1;
            }
          }

          let var previewUrl = "";
          let shouldDisplayUrl = environment.status == "running";
          if(shouldDisplayUrl) {
            previewUrl = "<a href=\"${environment.url}\">Visit Preview</a>";
          }

          let entryfile = "<a href=\"https://github.com/${environment.repo}/blob/${environment.branch}/${app.entryfile}\">${app.appName}</a>";

          let date = std.Datetime.utcNow();
          let dateStr = "${date.dayOfMonth}-${date.month}-${date.year} ${date.hours}:${date.min} (UTC)";
          let tableRows = "<tr><td>${entryfile}</td><td>${this.envStatusToString(environment.status)}</td><td>${previewUrl}</td><td>${dateStr}</td></tr>";
          let testsSection = "<details><summary>Tests</summary><br><table><tr><th>Test</th><th>Resource Path</th><th>Result</th></tr>${testRows}</table></details>";

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
