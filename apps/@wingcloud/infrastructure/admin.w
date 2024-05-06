bring cloud;
bring "./json-api.w" as json_api;
bring "./users.w" as Users;
bring "./apps.w" as Apps;
bring "./early-access.w" as early_access;

bring "./http-error.w" as httpError;
bring "./jwt.w" as JWT;
bring "./invalidate-query.w" as invalidate_query;
bring util;

struct AdminProps {
  api: json_api.JsonApi;
  users: Users.Users;
  apps: Apps.Apps;
  earlyAccess: early_access.EarlyAccess;
  getUserFromCookie: inflight(cloud.ApiRequest): JWT.JWTPayload?;
  invalidateQuery: invalidate_query.InvalidateQuery;
}

struct EarlyAccess {
  email: str;
  link: str;
}

pub class Admin {
  new(props: AdminProps) {
    let ADMIN_LOGS_KEY = "admin-logs";
    let ADMIN_USERNAMES = util.tryEnv("ADMIN_USERNAMES")?.split(",") ?? [];
    let WINGCLOUD_ORIGIN = util.tryEnv("WINGCLOUD_ORIGIN");

    let api = props.api;
    let users = props.users;
    let apps = props.apps;
    let earlyAccess = props.earlyAccess;
    let getUserFromCookie = props.getUserFromCookie;
    let invalidateQuery = props.invalidateQuery;

    // This method checks if the user has admin rights.
    let checkAdminAccessRights = inflight (request) => {
      if let userFromCookie = getUserFromCookie(request) {
        let user = users.get(userId: userFromCookie.userId);
        if user?.isAdmin? {
            return;
        }
      }
      throw httpError.HttpError.unauthorized();
    };

    // This middleware logs all admin actions
    api.addMiddleware(inflight (request, next) => {
      if request.path.startsWith("/wrpc/admin.") {
        let user = getUserFromCookie(request);
        log(Json.stringify({
          key: ADMIN_LOGS_KEY,
          user: user,
          method: "{request.method}",
          path: "{request.path}",
          query: request.query,
          body: request.body,
        }));
      }
      return next(request);
    });

    new cloud.OnDeploy(inflight () => {
      if ADMIN_USERNAMES.length == 0 {
        log("No admin usernames provided. No users will be set as admins.");
      }
      for username in ADMIN_USERNAMES {
        try {
          let user = users.getByName({
            username: username.trim()
          });
          users.setAdminRole({
            userId: user.id,
            username: user.username,
            isAdmin: true,
          });
        } catch {
          let user = users.create({
            username: username.trim(),
            displayName: username.trim(),
          });
          users.setAdminRole({
            userId: user.id,
            username: user.username,
            isAdmin: true,
          });
        }
      }

      let usersList = users.list();
      for user in usersList {
        if let codeRequired = user.isEarlyAccessCodeRequired {
          // If already set, skip
        } elif user.isAdmin != true {
          users.setEarlyAccessCodeRequired(
            userId: user.id,
            username: user.username,
            isEarlyAccessCodeRequired: true
          );
        }
      }
    });

    api.get("/wrpc/admin.users.list", inflight (request) => {
      checkAdminAccessRights(request);
      let users = users.list();
      return {
        body: {
          users: users
        },
      };
    });

    api.get("/wrpc/admin.apps.list", inflight (request) => {
      checkAdminAccessRights(request);
      let apps = apps.listAll();
      return {
        body: {
          apps: apps
        },
      };
    });

    api.post("/wrpc/admin.setAdminRole", inflight (request) => {
      checkAdminAccessRights(request);
      if let userFromCookie = getUserFromCookie(request) {
        let input = Json.parse(request.body ?? "");
        let userId = input.get("userId").asStr();
        let isAdmin = input.get("isAdmin").asBool();

        let user = users.get({
          userId: userId
        });

        users.setAdminRole({
          userId: userId,
          username: user.username,
          isAdmin: isAdmin,
        });

        invalidateQuery.invalidate(
          userId: userFromCookie.userId,
          queries: [
          "admin.users.list"
          ]
        );

        return {
          body: {},
        };
      }
      throw httpError.HttpError.unauthorized();
    });

    api.post("/wrpc/admin.earlyAccess.createCode", inflight (request) => {
      checkAdminAccessRights(request);
      if let userFromCookie = getUserFromCookie(request) {
        let input = Json.parse(request.body ?? "");
        let description = input.tryGet("description")?.tryAsStr() ?? "";

        let item = earlyAccess.createCode(
          description: description,
        );

        invalidateQuery.invalidate(
          userId: userFromCookie.userId,
          queries: [
          "admin.earlyAccess.listCodes"
          ]
        );

        return {
          body: {
            earlyAccessItem: item
          }
        };
      }
      throw httpError.HttpError.unauthorized();
    });

    api.post("/wrpc/admin.earlyAccess.deleteCode", inflight (request) => {
      checkAdminAccessRights(request);
      if let userFromCookie = getUserFromCookie(request) {
        let input = Json.parse(request.body ?? "");
        let code = input.get("code").asStr();

        earlyAccess.deleteCode(code: code);

        invalidateQuery.invalidate(
          userId: userFromCookie.userId,
          queries: [
          "admin.earlyAccess.listCodes"
          ]
        );

        return {
          body: {}
        };
      }
      throw httpError.HttpError.unauthorized();
    });

    api.get("/wrpc/admin.earlyAccess.listCodes", inflight (request) => {
      checkAdminAccessRights(request);

      let list = earlyAccess.listCodes();
      return {
        body: {
          earlyAccessList: list
        },
      };
    });

    api.post("/wrpc/admin.setEarlyAccessUser", inflight (request) => {
      checkAdminAccessRights(request);
      if let userFromCookie = getUserFromCookie(request) {
        let input = Json.parse(request.body ?? "");

        let userId = input.get("userId").asStr();
        let isEarlyAccessUser = input.get("isEarlyAccessUser").asBool();

        let user = users.get({
          userId: userId
        });

        users.setIsEarlyAccessUser(
          userId: userId,
          username: user.username,
          isEarlyAccessUser: isEarlyAccessUser
        );

        return {
          body: {}
        };
      }
      throw httpError.HttpError.unauthorized();
    });

    api.post("/wrpc/admin.requireEarlyAccessCode", inflight (request) => {
      checkAdminAccessRights(request);
      if let userFromCookie = getUserFromCookie(request) {
        let input = Json.parse(request.body ?? "");

        let userId = input.get("userId").asStr();
        let isEarlyAccessCodeRequired = input.get("isEarlyAccessCodeRequired").asBool();

        let user = users.get({
          userId: userId
        });

        users.setEarlyAccessCodeRequired(
          userId: userId,
          username: user.username,
          isEarlyAccessCodeRequired: isEarlyAccessCodeRequired
        );

        return {
          body: {}
        };
      }
      throw httpError.HttpError.unauthorized();
    });
  }
}
