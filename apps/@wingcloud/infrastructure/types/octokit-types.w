struct OctoKitListFilesObject {
  filename: str;
}

struct OctoKitListFilesResponse {
  status: num;
  data: Array<OctoKitListFilesObject>;
}

struct OctoKitPullsOptions {
  owner: str;
  repo: str;
  pull_number: num;
}

interface OctoKitPulls {
  inflight listFiles(options: OctoKitPullsOptions): OctoKitListFilesResponse;
}

struct CreateInstallationAccessTokenObject {
  token: str;
}

struct CreateInstallationAccessTokenResponse {
  status: num;
  data: CreateInstallationAccessTokenObject;
}

struct CreateInstallationAccessTokenOptions {
  installation_id: num;
}

interface OctoKitApps {
  inflight createInstallationAccessToken(options: CreateInstallationAccessTokenOptions): CreateInstallationAccessTokenResponse;
}

struct GetTreeOptionsObjectTree {
  path: str?;
  type: str?;
  url: str?;
}

struct GetTreeOptionsObject {
  truncated: bool;
  tree: Array<GetTreeOptionsObjectTree>;
}

struct GetTreeOptionsResponse {
  status: num;
  data: GetTreeOptionsObject;
}

struct GetTreeOptions {
  owner: str;
  repo: str;
  tree_sha: str;
  // any value means it will be recursive
  recursive: str?;
}

interface OctoKitGit {
  inflight getTree(options: GetTreeOptions): GetTreeOptionsResponse;
}

struct CommentResposeData {
  id: num;
}

struct CommentResponse {
  status: num;
  data: CommentResposeData;
}

struct CreateCommentOptions {
  owner: str;
  repo: str;
  issue_number: num;
  body: str?;
}

struct UpdateCommentOptions {
  owner: str;
  repo: str;
  comment_id: num;
  body: str?;
}

struct DeleteCommentOptions {
  owner: str;
  repo: str;
  comment_id: num;
}

struct ListCommentsResponseObject {
  body: str?;
}

struct ListCommentsResponse {
  status: num;
  data: Array<ListCommentsResponseObject>;
}

struct ListCommentsOptions {
  owner: str;
  repo: str;
  issue_number: num;
  body: str?;
}

interface OctoKitIssues {
  inflight createComment(options: CreateCommentOptions): CommentResponse;
  inflight updateComment(options: UpdateCommentOptions): CommentResponse;
  inflight deleteComment(options: DeleteCommentOptions): CommentResponse;
  inflight listComments(options: ListCommentsOptions): ListCommentsResponse;
}

pub struct OctoKit {
  pulls: OctoKitPulls;
  apps: OctoKitApps;
  git: OctoKitGit;
  issues: OctoKitIssues;
}
