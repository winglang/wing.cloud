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
    return status.at(0).uppercase() + status.substring(1);
  }

  pub inflight createOrUpdate(props: GithubCommentCreateProps): num {
    let wingIdentifier = "[wing]: wing";
    let var commentId: num? = nil;
    let var commentBody = "${wingIdentifier}

| App         | Status | Preview | Tests | Updated (UTC) |
| --------------- | ------ | ------- | ----- | -------------- |";
    for app in this.apps.listByRepository(repository: props.repo) {
      for environment in this.environments.list(appId: app.appId) {
        if environment.repo == props.repo && environment.prNumber == props.prNumber {
          let var testsString = "---";
          if let testResults = environment.testResults {
            testsString = "";
            let var i = 0;
            for testResult in testResults.testResults {
              let var icon = "✅";
              if !testResult.pass {
                icon = "❌";
              }
              testsString = "${icon} ${testResult.path}<br> ${testsString}";
              i += 1;
            }
          }

          let var previewUrl = "";
          let shouldDisplayUrl = environment.status == "running";
          if(shouldDisplayUrl) {
            previewUrl = "[Visit](${environment.url})";
          }

          let entryfile = "[${app.appName}](https://github.com/${environment.repo}/blob/${environment.branch}/${app.entryfile})";

          let date = std.Datetime.utcNow().toIso();
          let tableRows = "| ${entryfile} | ${this.envStatusToString(environment.status)} | ${previewUrl} | ${testsString} | ${date} |";

          commentBody = "${commentBody}\n${tableRows}";

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
