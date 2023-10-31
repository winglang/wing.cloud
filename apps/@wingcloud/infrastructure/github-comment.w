bring "./environments.w" as environments;
bring "./projects.w" as projects;
bring "./status-reports.w" as status_reports;
bring "./types/octokit-types.w" as octokit;

struct GithubCommentProps {
  environments: environments.Environments;
  projects: projects.Projects;
}

struct GithubCommentCreateProps {
  octokit: octokit.OctoKit;
  prNumber: num;
  repo: str;
}

pub class GithubComment {
  environments: environments.Environments;
  projects: projects.Projects;

  init(props: GithubCommentProps) {
    this.environments = props.environments;
    this.projects = props.projects;
  }

  pub inflight createOrUpdate(props: GithubCommentCreateProps): num {
    let wingIdentifier = "[wing]: wing";
    let var commentId: num? = nil;
    let var commentBody = "${wingIdentifier}

| Project         | Status | Preview | Tests | Updated (UTC) |
| --------------- | ------ | ------- | ----- | -------------- |";
    for project in this.projects.listByRepository(repository: props.repo) {
      for environment in this.environments.list(projectId: project.id) {
        if environment.repo == props.repo && environment.prNumber == props.prNumber {
          let var testsString = "---";
          if let testResults = environment.testResults {
            testsString = "";
            let var i = 0;
            for testResult in testResults.data.testResults {
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

          let entryfile = "[${project.name}](https://github.com/${environment.repo}/blob/${environment.branch}/${project.entryfile})";

          let date = std.Datetime.utcNow().toIso();
          let tableRows = "| ${entryfile} | ${environment.status} | ${previewUrl} | ${testsString} | ${date} |";

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
