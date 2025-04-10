bring cloud;
bring http;
bring ex;
bring util;
bring fs;

bring "./json-api.w" as json_api;
bring "./cookie.w" as Cookie;
bring "./github-tokens-table.w" as github_tokens_table;
bring "./github.w" as GitHub;
bring "./jwt.w" as JWT;
bring "./key-pair.w" as KeyPair;
bring "./apps.w" as Apps;
bring "./users.w" as Users;
bring "./environments.w" as Environments;
bring "./secrets.w" as Secrets;
bring "./endpoints.w" as Endpoints;
bring "./lowkeys-map.w" as lowkeys;
bring "./http-error.w" as httpError;
bring "./authenticated-websocket-server.w" as wsServer;
bring "./invalidate-query.w" as InvalidateQuery;
bring "./admin.w" as Admin;

struct Log {
  message: str;
  timestamp: str;
}

struct TestLog {
  id: str;
  path: str;
  pass: bool;
  error: str?;
  timestamp: str;
  time: num;
  traces: Array<Log>;
}

struct DeleteAppMessage {
  appId: str;
  appName: str;
  userId: str;
  timestamp: num;
}

struct CreateProductionEnvironmentMessage {
  appName: str;
  userId: str;
  repoId: str;
  repoOwner: str;
  repoName: str;
  defaultBranch: str;
  installationId: num;
  appId: str;
  entrypoint: str;
  timestamp: num;
}

struct GetListOfEntrypointsProps {
  accessToken: str;
  owner: str;
  repo: str;
  defaultBranch: str;
}

struct EnvironmentReportMessage {
  environmentId: str;
}

struct AnalyticsSignInMessage {
  anonymousId: str;
  userId: str;
  email: str?;
  github: str;
}

struct AuthCookieOptions {
  userId: str;
  username: str;
  email: str?;
  isAdmin: bool;
}

// TODO: https://github.com/winglang/wing/issues/3644
class Util {
  extern "./util.js" pub static inflight replaceAll(value:str, regex:str, replacement:str): str;
  extern "./util.js" pub static inflight parseLog(log: str): Log?;
  extern "./util.js" pub static inflight encodeURIComponent(value: str): str;

  pub static inflight parseLogs(messages: Array<str>): Array<Log> {
    let var parsedLogs = MutArray<Log>[];

    let var previousTime = "";
    for message in messages {
      if let var log = Util.parseLog(message) {
        if (log.timestamp != "") {
            previousTime = log.timestamp;
        } else {
            log = Log {
                message: log.message,
                timestamp: previousTime,
            };
        }
        parsedLogs.push(log);
      }
    }
    return parsedLogs.copy();
  }
}

bring "./environment-manager.w" as EnvironmentManager;
bring "./status-reports.w" as status_reports;
bring "./probot-adapter.w" as adapter;
bring "./octokit.w" as Octokit;
bring "./segment-analytics.w" as analytics;
bring "./early-access.w" as early_access;

struct ApiProps {
  api: cloud.Api;
  ws: wsServer.AuthenticatedWebsocketServer;
  apps: Apps.Apps;
  users: Users.Users;
  environments: Environments.Environments;
  environmentManager: EnvironmentManager.EnvironmentManager;
  secrets: Secrets.Secrets;
  endpoints: Endpoints.Endpoints;
  probotAdapter: adapter.ProbotAdapter;
  githubAppClientId: str;
  githubAppClientSecret: str;
  githubAppCallbackOrigin: str;
  appSecret: str;
  wsSecret: str;
  logs: cloud.Bucket;
  analytics: analytics.SegmentAnalytics;
  segmentWriteKey: str;
  earlyAccess: early_access.EarlyAccess;
}


struct EnvironmentAction {
  type: str;
  data: Json;
}

pub class Api {
  pub api: json_api.JsonApi;
  new(props: ApiProps) {
    let REQUIRE_EARLY_ACCESS_CODE = util.tryEnv("REQUIRE_EARLY_ACCESS_CODE") == "true";
    let EARLY_ACCESS_USERS_MAX_APPS = 5;

    let api = new json_api.JsonApi(api: props.api);
    this.api = api;
    let ws = props.ws;
    let apps = props.apps;
    let users = props.users;
    let environments = props.environments;
    let logs = props.logs;
    let environmentsQueue = new cloud.Queue() as "Environments-Queue";
    let earlyAccess = props.earlyAccess;

    let INVALIDATE_SUBSCRIPTION_ID = "invalidateQuery";
    let invalidateQuery = new InvalidateQuery.InvalidateQuery(
      ws: ws,
      subscriptionId: INVALIDATE_SUBSCRIPTION_ID
    );

    props.environmentManager.onEnvironmentChange(inflight (environment) => {
      if let app = apps.tryGet(appId: environment.appId) {
        let updatedEnvironment = props.environments.get(id: environment.id);
        let queries = MutArray<str>["app.listEnvironments", "app.environment"];
        if environment.type == "production" && (updatedEnvironment.status != app.status ?? "") {
          apps.updateStatus(
            appId: app.appId,
            appName: app.appName,
            repoId: app.repoId,
            userId: app.userId,
            status: updatedEnvironment.status,
          );
          // update the app list when a production environment is modified.
          queries.concat(MutArray<str>["app.list", "app.getByName?appName={app.appName}"]);
        }
        invalidateQuery.invalidate(userId: app.userId, queries: queries.copy());
      }
    });

    props.environmentManager.onEndpointChange(inflight (endpoint) => {
      if let app = apps.tryGet(appId: endpoint.appId) {
        invalidateQuery.invalidate(userId: app.userId, queries: [
          "app.environment.endpoints"
        ]);
      }
    });

    let AUTH_COOKIE_NAME = "auth";

    let githubAccessTokens = new github_tokens_table.GithubAccessTokensTable(
      encryptionKey: props.appSecret,
    );

    let getJWTPayloadFromCookie = inflight (request: cloud.ApiRequest): JWT.JWTPayload? => {
      let headers = lowkeys.LowkeysMap.fromMap(request.headers ?? {});
      if let cookies = headers.tryGet("cookie") {
        if let jwt = Cookie.Cookie.parse(cookies).tryGet(AUTH_COOKIE_NAME) {
          try {
            return JWT.JWT.verify(
              jwt: jwt,
              secret: props.appSecret,
            );
          } catch {
            return nil;
          }
        }
      }
    };

    let getJWTPayloadFromBearer = inflight (publicKey: str, request: cloud.ApiRequest): Map<str>? => {
      let headers = lowkeys.LowkeysMap.fromMap(request.headers ?? {});
      let input = Json.parse(request.body ?? "");

      if let authHeader = headers.tryGet("authorization") {
        let token = authHeader.replace("Bearer","").trim();
        try {
          return KeyPair.KeyPair.verify(token: token, publicKey: publicKey);
        } catch {
          return nil;
        }
      }
    };

    let getUserFromCookie = inflight (request: cloud.ApiRequest): JWT.JWTPayload? => {
      if let payload = getJWTPayloadFromCookie(request) {
        return {
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          isAdmin: payload.isAdmin,
        };
      }
      return nil;
    };

    let getUserIdFromCookie = inflight (request: cloud.ApiRequest): str => {
      if let payload = getUserFromCookie(request) {
        return payload.userId;
      }
      throw httpError.HttpError.unauthorized();
    };

    // Checks if the user has access rights to the owner's resources.
    // The user must be an admin or the owner of the resource.
    let checkOwnerAccessRights = inflight (request: cloud.ApiRequest, owner: str) => {
      if let user = getUserFromCookie(request) {
        if user.username == owner {
          return;
        }
        if user.isAdmin {
          if request.method == cloud.HttpMethod.GET {
            return;
          }
          if request.method == cloud.HttpMethod.POST {
            // The path starts with "/prod" in production
            if request.path.endsWith("/wrpc/app.environment.restart") {
              return;
            }
            if request.path.endsWith("/wrpc/app.delete") {
              return;
            }
          }
          throw httpError.HttpError.unauthorized("Admin is not authorized to perform this action");
        }
      }
      // TODO: Currently we only allow the signed in user to access their own resources.
      throw httpError.HttpError.notFound("User '{owner}' not found");
    };

    // Checks if the user has access rights to the app.
    // The user must be an admin or the owner of the app.
    let checkAppAccessRights = inflight (request: cloud.ApiRequest, app: Apps.App): Apps.App => {
      if let user = getUserFromCookie(request) {
        if user.userId == app.userId {
          return app;
        }
        if user.isAdmin {
          if request.method == cloud.HttpMethod.GET {
            return app;
          } if request.method == cloud.HttpMethod.POST {
            // The path starts with "/prod" in production
            if request.path.endsWith("/wrpc/app.environment.restart") {
              return app;
            }
            if request.path.endsWith("/wrpc/app.delete") {
              return app;
            }
          }
          throw httpError.HttpError.unauthorized("Admin is not authorized to perform this action");
        }
      }
      throw httpError.HttpError.notFound("App not found");
    };

    let getOwnerUserId = inflight (request: cloud.ApiRequest, owner: str): str => {
      if let loggedUser = getUserFromCookie(request) {
        if loggedUser.username == owner {
          return loggedUser.userId;
        }
      }
      if let user = users.fromLogin(username: owner) {
        return user.id;
      }
      throw httpError.HttpError.notFound("User '{owner}' not found");
    };

    let getAccessTokenFromCookie = inflight (request: cloud.ApiRequest): str? => {
      if let user = getUserFromCookie(request) {
        return githubAccessTokens.get(user.userId)?.access_token;
      }
    };

    let getInstallationId = inflight(accessToken: str, repoOwner: str): num => {
      let installations = GitHub.Client.listUserInstallations(accessToken);
      for installation in installations.data {
        if installation.account.login == repoOwner {
          return installation.id;
        }
      }
      throw httpError.HttpError.badRequest("Installation not found");
    };

    let createAuthCookie = inflight (options: AuthCookieOptions): str => {
      let jwt = JWT.JWT.sign(
        secret: props.appSecret,
        userId: options.userId,
        email: options.email,
        username: options.username,
        isAdmin: options.isAdmin,
      );

      return Cookie.Cookie.serialize(
        AUTH_COOKIE_NAME,
        jwt,
        {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          path: "/",
          maxAge: 1h.seconds,
        },
      );
    };

    // This middleware refreshes the expiration time of the auth cookie,
    // unless the cookie is already set during the response.
    api.addMiddleware(inflight (request, next) => {
      let response = next(request);
      let headers = (response.headers ?? {}).copyMut();

      if headers.has("Set-Cookie") {
        return response;
      }

      try {
        if let user = getUserFromCookie(request) {
          let cookie = createAuthCookie(
            userId: user.userId,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
          );
          headers.set("Set-Cookie", cookie);
          return {
            status: response.status,
            body: response.body,
            headers: headers.copy(),
          };
        }
      } catch {}
      return response;
    });

    // This middleware checks the owner access rights
    api.addMiddleware(inflight (request, next) => {
      if request.method == cloud.HttpMethod.GET {
        if let owner = request.query.tryGet("owner") {
          checkOwnerAccessRights(request, owner);
        }
      }
      if request.method == cloud.HttpMethod.POST {
        let input = Json.tryParse(request.body ?? "");
        if let owner = input?.tryGet("owner")?.tryAsStr() {
          checkOwnerAccessRights(request, owner);
        }
      }
      return next(request);
    });

     // add the admin API
     new Admin.Admin(
      api: api,
      users: users,
      apps: apps,
      earlyAccess: earlyAccess,
      getUserFromCookie: getUserFromCookie,
      invalidateQuery: invalidateQuery,
    );

    let analyticsSignInQueue = new cloud.Queue() as "AnalyticsSignIn-Queue";
    analyticsSignInQueue.setConsumer(inflight (message) => {
      let event = AnalyticsSignInMessage.fromJson(Json.parse(message));
      props.analytics.identify(
        anonymousId: event.anonymousId,
        userId: event.userId,
        traits: {
          email: event.email,
          github: event.github,
        },
      );
      props.analytics.track(
        anonymousId: event.anonymousId,
        userId: event.userId,
        event: "console_sign_in",
        properties: {
          email: event.email,
          github: event.github,
        },
      );
    });

    api.get("/wrpc/github.callback", inflight (request) => {
      try {
        let code = request.query.get("code");
        let tokens = GitHub.Exchange.codeForTokens(
          code: code,
          clientId: props.githubAppClientId,
          clientSecret: props.githubAppClientSecret,
        );

        let githubUser = GitHub.Client.getUser(tokens.access_token);

        let var isEarlyAccessCodeRequired = false;

        if REQUIRE_EARLY_ACCESS_CODE {
          if let userExists = users.fromLogin(username: githubUser.login) {
            isEarlyAccessCodeRequired =
              userExists.isEarlyAccessUser == true &&
              userExists.isEarlyAccessCodeRequired == true;
          } else {
            isEarlyAccessCodeRequired = true;
          }
          if isEarlyAccessCodeRequired {
            if let code = request.query.tryGet("early-access-code") {
              earlyAccess.validateCode(code: code);
              log("{githubUser.login} is allowed to access the early access");
              isEarlyAccessCodeRequired = false;
            }
          }
        }

        let user = users.updateOrCreate(
          displayName: githubUser.name ?? githubUser.login,
          username: githubUser.login,
          avatarUrl: githubUser.avatar_url,
          email: githubUser.email,
          isEarlyAccessUser: REQUIRE_EARLY_ACCESS_CODE,
          isEarlyAccessCodeRequired: isEarlyAccessCodeRequired,
        );

        githubAccessTokens.set(user.id, tokens);

        let authCookie = createAuthCookie(
          userId: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin ?? false,
        );

        // The default redirect location is the user's profile page,
        // but in the case of the Console Sign In process, we want to redirect
        // to the Console instead.
        let var location = "/{user.username}";

        log("anonymousId = {request.query.tryGet("anonymousId") ?? ""}");

        // Console Sign In process
        if let anonymousId = request.query.tryGet("anonymousId") {
          log("segmentWriteKey = {props.segmentWriteKey}");
          log("Identifying anonymous user as {user.username}");
          if let port = request.query.tryGet("port") {
            analyticsSignInQueue.push(Json.stringify(AnalyticsSignInMessage {
              anonymousId: anonymousId,
              userId: user.id,
              email: user.email,
              github: user.username,
            }));
            log("redirecting to console");
            // Redirect back to the local Console, using the `signedIn`
            // GET parameter so the Console dismisses the sign in modal.
            // We are going though the wing.cloud/signupredirect endpoint in order
            // for it to close the attribution loop in Plausible.
            // It then redirects to http://localhost:{port}/?signedIn
            let redirect = Util.encodeURIComponent("http://localhost:{port}/?signedIn");
            location = "https://wing.cloud/signupredirect?redirect={redirect}";
            return {
              status: 302,
              headers: {
                Location: location,
                "Set-Cookie": authCookie,
              },
            };
          }
        }

        if isEarlyAccessCodeRequired {
          throw httpError.HttpError.badRequest("An early access code is required.");
        }

        return {
          status: 302,
          headers: {
            Location: location,
            "Set-Cookie": authCookie,
          },
        };
      } catch error {
        let errorData = Json.tryParse(error);

        let code = errorData?.tryGet("code")?.tryAsStr() ?? "500";
        let message = errorData?.tryGet("message")?.tryAsStr() ?? "Something went wrong.";

        return {
          status: 302,
          headers: {
            Location: "/login?error={util.base64Encode(error)}",
          },
          body: error,
        };
      }
    });

    api.get("/wrpc/ws.invalidateQuery.auth", inflight (request) => {
      try {
        if let user = getUserFromCookie(request) {
          let jwt = JWT.JWT.sign(
            secret: props.wsSecret,
            userId: user.userId,
            email: user.email,
            username: user.username,
            isAdmin: user.isAdmin,
            expirationTime: "1m",
          );
          return {
            body: {
              token: jwt,
              subscriptionId: INVALIDATE_SUBSCRIPTION_ID,
            },
          };
        }
      } catch {}
      throw httpError.HttpError.unauthorized();
    });

    api.get("/wrpc/auth.check", inflight (request) => {
      try {
        // check if the user from the cookie is valid
        let userId = getUserIdFromCookie(request);

        // check if user exists in the db
        let user = users.get(userId: userId);

        return {
          body: {
            user: user
          },
        };
      } catch {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.post("/wrpc/auth.signOut", inflight (request) => {
      return {
        headers: {
          "Set-Cookie": Cookie.Cookie.serialize(
            AUTH_COOKIE_NAME,
            "",
            {
              httpOnly: true,
              secure: true,
              sameSite: "strict",
              expires: 0,
              path: "/",
            },
          ),
        },
        body: {
        },
      };
    });

    api.get("/wrpc/console.signIn", inflight (request) => {
      // Redirect to the GitHub App OAuth flow, specifying the final redirect back to
      // Wing Cloud, including the Console local port and the user's local anonymousId.
      let port = request.query.get("port");
      let anonymousId = Util.encodeURIComponent(request.query.get("anonymousId"));
      let redirectURI = Util.encodeURIComponent("{props.githubAppCallbackOrigin}/wrpc/github.callback?port={port}&anonymousId={anonymousId}");

      return {
        status: 302,
        headers: {
          Location: "https://github.com/login/oauth/authorize?client_id={props.githubAppClientId}&redirect_uri={redirectURI}",
        },
      };
    });

    api.get("/wrpc/github.listInstallations", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let page = num.fromStr(request.query.get("page"));
        let data = GitHub.Client.listUserInstallations(accessToken, page);

        return {
          body: data,
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/github.listRepositories", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let installationId = num.fromStr(request.query.get("installationId"));
        let page = num.fromStr(request.query.get("page"));

        let data = GitHub.Client.listInstallationRepos(accessToken, installationId, page);

        return {
          body: data,
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/github.getRepository", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let owner = request.query.get("owner");
        let repo = request.query.get("repo");

        let repository = GitHub.Client.getRepository({
          token: accessToken,
          owner: owner,
          repo: repo,
        });

        return {
          body: {
            repository: repository
          },
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/github.getPullRequest", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let owner = request.query.get("owner");
        let repo = request.query.get("repo");
        let pullNumber = request.query.get("pullNumber");

        let pullRequest = GitHub.Client.getPullRequest({
          token: accessToken,
          owner: owner,
          repo: repo,
          pull_number: pullNumber,
        });

        return {
          body: {
            pullRequest: pullRequest
          },
        };
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    let productionEnvironmentQueue = new cloud.Queue() as "ProductionEnvironment-Queue";
    productionEnvironmentQueue.setConsumer(inflight (event) => {
      let input = CreateProductionEnvironmentMessage.fromJson(Json.parse(event));
      if let accessToken = githubAccessTokens.get(input.userId)?.access_token {
        let commitData = GitHub.Client.getLastCommit(
          token: accessToken,
          owner:  input.repoOwner,
          repo: input.repoName,
          default_branch: input.defaultBranch,
        );

        let installationId = input.installationId;
        environmentsQueue.push(Json.stringify(EnvironmentAction {
          type: "create",
          data: EnvironmentManager.CreateEnvironmentOptions {
            createEnvironment: {
              branch: input.defaultBranch,
              sha: commitData.sha,
              appId: input.appId,
              type: "production",
              prTitle: input.defaultBranch,
              repo: input.repoId,
              status: "initializing",
              installationId: installationId,
            },
            appId: input.appId,
            entrypoint: input.entrypoint,
            sha: commitData.sha,
            owner: input.repoOwner,
            timestamp: input.timestamp,
        }}));

        apps.updateLastCommit(
          userId: input.userId,
          appId: input.appId,
          appName: input.appName,
          repoId: input.repoId,
          lastCommitSha: commitData.sha,
          lastCommitMessage: commitData.commit.message,
          lastCommitDate: commitData.commit.author.date ?? "",
        );
        invalidateQuery.invalidate(userId: input.userId, queries: ["app.list", "app.getByName?appName={input.appName}"]);
      } else {
        throw httpError.HttpError.unauthorized();
      }
    });

    let getListOfEntrypoints = inflight (props: GetListOfEntrypointsProps): MutArray<str> => {
      let octokit = Octokit.octokit(props.accessToken);
      let ref = octokit.git.getRef(owner: props.owner, repo: props.repo, ref: "heads/{props.defaultBranch}");
      let tree = octokit.git.getTree(owner: props.owner, repo: props.repo, tree_sha: ref.data.object.sha, recursive: "true");

      let entrypoints = MutArray<str>[];
      for item in tree.data.tree {
        if let path = item.path {
          if item.type == "blob" {
            if path.endsWith("main.w") || path.endsWith("main.ts") {
              entrypoints.push(path);
            }
          }
        }
      }
      return entrypoints;
    };

    let getMainEntrypointFile = inflight (props: GetListOfEntrypointsProps): str => {
      let entrypoints = getListOfEntrypoints(props);

      for entrypoint in entrypoints {
        if fs.basename(entrypoint) == "main.w" {
          return entrypoint;
        }
      }
      // don't know if we should throw an exception here or let the failure happen in the preview deployment phase
      return "";
    };

    api.post("/wrpc/app.create", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let input = Json.parse(request.body ?? "");

        let owner = input.get("owner").asStr();
        let defaultBranch = input.get("defaultBranch").asStr();
        let repoOwner = input.get("repoOwner").asStr();
        let repoName = input.get("repoName").asStr();

        let user = users.fromLoginOrFail(username: owner);

        if let isEarlyAccessUser = user.isEarlyAccessUser {
          if isEarlyAccessUser {
            let userApps = apps.list(userId: user.id);
            if userApps.length >= EARLY_ACCESS_USERS_MAX_APPS {
              throw httpError.HttpError.forbidden(
                "You have reached the maximum number of apps allowed for early access users."
              );
            }
          }
        }

        let installationId = getInstallationId(accessToken, repoOwner);

        // get application default entrypoint path (main.w)
        let entrypoint = getMainEntrypointFile(GetListOfEntrypointsProps{
          accessToken: accessToken,
          owner: repoOwner,
          repo: repoName,
          defaultBranch: defaultBranch,
        });

        // TODO: https://github.com/winglang/wing/issues/3644
        let appName = Util.replaceAll(input.get("appName").asStr(), "[^a-zA-Z0-9._-]+", "*");
        if appName.contains("*") {
          throw httpError.HttpError.badRequest(
            "The app name can only contain ASCII letters, digits, and the characters ., - and _."
          );
        }

        let repoId = "{repoOwner}/{repoName}";
        let createAppOptions = {
          appName: appName,
          appFullName: "{user.username}/{appName}",
          description: input.tryGet("description")?.tryAsStr() ?? "",
          repoId: repoId,
          repoName: repoName,
          repoOwner: repoOwner,
          userId: user.id,
          entrypoint: entrypoint,
          createdAt: datetime.utcNow().toIso(),
          defaultBranch: defaultBranch,
          status: "initializing",
        };

        let appId = apps.create(createAppOptions);

        let appOptions = Json.deepCopyMut(createAppOptions);
        appOptions.set("appId", appId);

        let app = Apps.App.fromJson(appOptions);

        productionEnvironmentQueue.push(Json.stringify(CreateProductionEnvironmentMessage {
          appId: app.appId,
          appName: app.appName,
          userId: app.userId,
          repoId: app.repoId,
          repoOwner: app.repoOwner,
          repoName: app.repoName,
          entrypoint: app.entrypoint,
          defaultBranch: defaultBranch,
          installationId: installationId,
          timestamp: datetime.utcNow().timestampMs,
        }));

        invalidateQuery.invalidate(userId: user.id, queries: ["app.list"]);
        return {
          body: {
            app: app,
          },
        };
      }
      throw httpError.HttpError.unauthorized();
    });

    api.get("/wrpc/app.list", inflight (request) => {
      let owner = request.query.get("owner");
      let userId = getOwnerUserId(request, owner);

      let userApps = apps.list(userId: userId);
      return {
        body: {
          apps: userApps,
        },
      };
    });

    let deleteAppQueue = new cloud.Queue() as "DeleteApp-Queue";
    deleteAppQueue.setConsumer(inflight (event) => {
      let input = DeleteAppMessage.fromJson(Json.parse(event));

      let environmentsList = environments.list(
        appId: input.appId,
      );

      for environment in environmentsList {
        props.environmentManager.stop(
          appId: input.appId,
          appName: input.appName,
          environment: environment,
          timestamp: input.timestamp,
          delete: true,
        );
      }
    });

    api.post("/wrpc/app.delete", inflight (request) => {

      let input = Json.parse(request.body ?? "");
      let appName = input.get("appName").asStr();

      let userId = getOwnerUserId(request, input.get("owner").asStr());

      let app = apps.getByName(
        userId: userId,
        appName: appName,
      );

      apps.delete(
        appId: app.appId,
        userId: userId,
      );

      invalidateQuery.invalidate(userId: userId, queries: ["app.list"]);

      deleteAppQueue.push(Json.stringify(DeleteAppMessage {
        appId: app.appId,
        appName: app.appName,
        userId: app.userId,
        timestamp: datetime.utcNow().timestampMs,
      }));

      return {
        body: {
          appId: app.appId,
        },
      };
    });

    api.get("/wrpc/app.getByName", inflight (request) => {
      let userId = getOwnerUserId(request, request.query.get("owner"));

      let app = apps.getByName(
        userId: userId,
        appName: request.query.get("appName"),
      );
      checkAppAccessRights(request, app);

      return {
        body: {
          app: app,
        },
      };
    });

    api.get("/wrpc/app.listEnvironments", inflight (request) => {
      let owner = request.query.get("owner");
      let userId = getOwnerUserId(request, owner);

      let app = apps.getByName(
        userId: userId,
        appName: request.query.get("appName")
      );
      checkAppAccessRights(request, app);

      let environmentsList = environments.list(
        appId: app.appId,
      );

      return {
        body: {
          environments: environmentsList,
        },
      };
    });

    api.get("/wrpc/app.environment", inflight (request) => {
      let owner = request.query.get("owner");
      let userId = getOwnerUserId(request, owner);

      let app = apps.getByName(
        userId: userId,
        appName: request.query.get("appName"),
      );
      checkAppAccessRights(request, app);

      let environment = props.environments.getByBranch(
        appId: app.appId,
        branch: request.query.get("branch"),
      );

      return {
        body: {
          environment: environment,
        },
      };
    });

    api.post("/wrpc/app.environment.restart", inflight (request) => {
      let input = Json.parse(request.body ?? "");
      let owner = input.get("owner").asStr();
      let appName = input.get("appName").asStr();
      let branch = input.get("branch").asStr();

      try {
        let userId = getOwnerUserId(request, owner);
        let app = apps.getByName(
          userId: userId,
          appName: appName,
        );
        checkAppAccessRights(request, app);

        let environment = environments.getByBranch(
          appId: app.appId,
          branch: branch,
        );
        let validStatus = ["error", "running"];
        if !validStatus.contains(environment.status) {
          throw httpError.HttpError.badRequest("Environment is not in a valid state to be restarted.");
        }

        environmentsQueue.push(Json.stringify(EnvironmentAction {
          type: "restart",
          data: EnvironmentManager.RestartEnvironmentOptions {
            appId: app.appId,
            environment: environment,
            entrypoint: app.entrypoint,
            sha: environment.sha,
            timestamp: datetime.utcNow().timestampMs,
          },
        }));

        return {
          body: {
            appId: app.appId,
          },
        };
      } catch {
        throw httpError.HttpError.unauthorized();
      }
    });

    api.get("/wrpc/app.listSecrets", inflight (request) => {
      let owner = request.query.get("owner");
      let userId = getOwnerUserId(request, owner);

      let app = apps.getByName(
        userId: userId,
        appName: request.query.get("appName"),
      );
      checkAppAccessRights(request, app);

      let prodSecrets = props.secrets.list(appId: app.appId, environmentType: "production");
      let previewSecrets = props.secrets.list(appId: app.appId, environmentType: "preview");

      return {
        body: {
          secrets: prodSecrets.concat(previewSecrets)
        },
      };
    });

    api.post("/wrpc/app.decryptSecret", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");

      let appId = input.get("appId").asStr();
      let app = apps.get(
        appId: appId,
      );
      checkAppAccessRights(request, app);

      let secretId = input.get("secretId").asStr();
      let environmentType = input.get("environmentType").asStr();

      let secret = props.secrets.get(id: secretId, appId: appId, environmentType: environmentType, decryptValue: true);

      return {
        body: {
          value: secret.value,
        },
      };
    });

    api.post("/wrpc/app.createSecret", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(
        appId: appId,
      );

      // Only the app owner can create secrets
      if userId != app.userId {
        throw httpError.HttpError.unauthorized();
      }

      checkAppAccessRights(request, app);

      let environmentType = input.get("environmentType").asStr();
      if environmentType != "production" && environmentType != "preview" {
        throw httpError.HttpError.badRequest(
          "Invalid environment type",
        );
      }

      let name = input.get("name").asStr();
      if name == "" {
        throw httpError.HttpError.badRequest(
          "Invalid name",
        );
      }

      let value = input.get("value").asStr();
      if value == "" {
        throw httpError.HttpError.badRequest(
          "Invalid value",
        );
      }

      let secret = props.secrets.create(appId: appId, environmentType: environmentType, name: name, value: value);

      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.listSecrets",
      ]);

      return {
        body: {
          secret: secret
        }
      };
    });

    api.post("/wrpc/app.deleteSecret", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(
        appId: appId,
      );
      checkAppAccessRights(request, app);

      let environmentType = input.get("environmentType").asStr();
      let secretId = input.get("secretId").asStr();

      props.secrets.delete(id: secretId, appId: appId, environmentType: environmentType);

      invalidateQuery.invalidate(userId: app.userId, queries: [
        "app.listSecrets",
      ]);

      return {
        body: {
          secretId: secretId
        }
      };
    });

    api.get("/wrpc/app.listEntrypoints", inflight (request) => {
      if let accessToken = getAccessTokenFromCookie(request) {
        let owner = request.query.get("owner");
        let repo = request.query.get("repo");
        let defaultBranch = request.query.get("default_branch");

        let entrypoints = getListOfEntrypoints(GetListOfEntrypointsProps{
          accessToken: accessToken,
          owner: owner,
          repo: repo,
          defaultBranch: defaultBranch,
        });

        return {
          body: {
            entrypoints: entrypoints.copy()
          },
        };
      }
      throw httpError.HttpError.notFound();
    });

    api.post("/wrpc/app.updateEntrypoint", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(appId: appId);
      checkAppAccessRights(request, app);

      let entrypoint = input.get("entrypoint").asStr();
      apps.updateEntrypoint(
        appId: appId,
        appName: app.appName,
        repository: app.repoId,
        userId: userId,
        entrypoint: entrypoint,
      );

      environmentsQueue.push(Json.stringify(EnvironmentAction{
        type: "restartAll",
        data: EnvironmentManager.RestartAllEnvironmentOptions {
          appId: appId,
          entrypoint: entrypoint,
          timestamp: datetime.utcNow().timestampMs,
      }}));

      invalidateQuery.invalidate(userId: userId, queries: [
        "app.listEntrypoints",
      ]);

      return {
        body: {
          appId: appId,
        },
      };
    });

    api.post("/wrpc/app.updateDescription", inflight (request) => {
      let userId = getUserIdFromCookie(request);
      let input = Json.parse(request.body ?? "");
      let appId = input.get("appId").asStr();

      let app = apps.get(appId: appId);
      checkAppAccessRights(request, app);

      let description = input.get("description").asStr();
      apps.updateDescription(
        appId: appId,
        appName: app.appName,
        repoId: app.repoId,
        userId: userId,
        description: description,
      );

      invalidateQuery.invalidate(userId: userId, queries: [
        "app.getByName?appName={app.appName}",
        "app.list",
      ]);

      return {
        body: {
          appId: appId,
        },
      };
    });

    api.get("/wrpc/app.environment.logs", inflight (request) => {
      let owner = request.query.get("owner");
      let appName = request.query.get("appName");
      let branch = request.query.get("branch");
      let userId = getOwnerUserId(request, owner);

      let app = apps.getByName(
        userId: userId,
        appName: appName,
      );
      checkAppAccessRights(request, app);

      let environment = props.environments.getByBranch(
        appId: app.appId,
        branch: branch,
      );

      let envId = environment.id;

      let var deployLogs = [];
      try {
        let deployMessages = logs.tryGet("{envId}/deployment.log")?.split("\n") ?? [];
        deployLogs = Util.parseLogs(deployMessages);
      } catch err {
        deployLogs = [];
        log("failed to parse deployment logs {err}");
      }

      let var runtimeLogs = [];
      try {
        let runtimeMessages = logs.tryGet("{envId}/runtime.log")?.split("\n") ?? [];
        runtimeLogs = Util.parseLogs(runtimeMessages);
      } catch err {
        runtimeLogs = [];
        log("failed to parse runtime logs {err}");
      }

      let var testLogs = MutArray<TestLog>[];
      try {
        let testEntries = logs.list("{envId}/tests");
        for entry in testEntries {
          let testResults = logs.getJson(entry);
          testLogs.push(TestLog.fromJson(testResults));
        }
      } catch err {
        testLogs = MutArray<TestLog>[];
        log("failed to parse test logs {err}");
      }

      return {
        body: {
          deploy: deployLogs,
          runtime: runtimeLogs,
          tests: testLogs.copy()
        },
      };
    });

    api.get("/wrpc/app.environment.endpoints", inflight (request) => {
      let owner = request.query.get("owner");
      let userId = getOwnerUserId(request, owner);

      let app = apps.getByName(
        userId: userId,
        appName: request.query.get("appName"),
      );

      let environment = props.environments.getByBranch(
        appId: app.appId,
        branch: request.query.get("branch"),
      );

      let endpoints = props.endpoints.list(environmentId: environment.id);

      return {
        body: {
          endpoints: endpoints,
        },
      };
    });


    let notifyEnvReportQueue = new cloud.Queue() as "EnvironmentReport-Queue";
    notifyEnvReportQueue.setConsumer(inflight (event) => {
      let input = EnvironmentReportMessage.fromJson(Json.parse(event));

      if let environment = props.environments.tryGet(id: input.environmentId) {
        if let app = props.apps.tryGet(appId: environment.appId) {
          invalidateQuery.invalidate(userId: app.userId, queries: [
            "app.listEnvironments",
            "app.environment",
            "app.environment.logs",
            "app.environment.endpoints",
          ]);
        }
      }
    });

    api.post("/environment.report", inflight (request) => {
      if let event = request.body {
        log("report status: {event}");
        let data = Json.parse(event);
        let statusReport = status_reports.StatusReport.fromJson(data);
        let publicKey = props.environments.getPublicKey(id: statusReport.environmentId);

        if let payload = getJWTPayloadFromBearer(publicKey, request) {
          let payloadEnvironmentId = payload.get("environmentId");

          if payloadEnvironmentId == statusReport.environmentId {
            props.environmentManager.updateStatus(statusReport: statusReport);

            notifyEnvReportQueue.push(Json.stringify(EnvironmentReportMessage {
              environmentId: statusReport.environmentId,
            }));

            return {
              status: 200
            };
          }
        }
      }
      throw httpError.HttpError.badRequest("Invalid status report");
    });

    environmentsQueue.setConsumer(inflight (event) => {
      try {
        let action = EnvironmentAction.parseJson(event);
        if action.type == "create" {
          log("create new environment event: {event}");
          let createOptions = EnvironmentManager.CreateEnvironmentOptions.fromJson(action.data);
          props.environmentManager.create(createOptions);
        } elif action.type == "restartAll" {
          log("restart all environments event: {event}");
          let restartAllOptions = EnvironmentManager.RestartAllEnvironmentOptions.fromJson(action.data);
          props.environmentManager.restartAll(restartAllOptions);
        } elif action.type == "restart" {
          log("restart environment event: {event}");
          let restartOptions = EnvironmentManager.RestartEnvironmentOptions.fromJson(action.data);
          props.environmentManager.restart(restartOptions);
        }
      } catch err {
        log("failed to execute environment action {err}");
      }
    });
  }
}
