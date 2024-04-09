bring cloud;
bring "./json-api.w" as json_api;
bring "./users.w" as users;

bring "./http-error.w" as httpError;
bring "./jwt.w" as JWT;
bring "./invalidate-query.w" as invalidate_query;
bring util;

struct AdminProps {
  api: json_api.JsonApi;
  users: users.Users;
  getUserFromCookie: inflight(cloud.ApiRequest): JWT.JWTPayload?;
  invalidateQuery: invalidate_query.InvalidateQuery;
}

pub class Admin {
  new(props: AdminProps) {
    let ADMIN_LOGS_KEY = "admin-logs";
    let ADMIN_USERNAMES = util.tryEnv("ADMIN_USERNAMES")?.split(",") ?? [];

    let api = props.api;
    let users = props.users;
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

    // This middleware checks if the user is an admin before allowing access to the admin API
    api.addMiddleware(inflight (request, next) => {
      if request.path.startsWith("/wrpc/admin.") {
        checkAdminAccessRights(request);
      }
      return next(request);
    });

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
        return;
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
    });

    api.get("/wrpc/admin.users.list", inflight (request) => {
      let users = users.list();
      return {
        body: {
          users: users
        },
      };
    });

    api.post("/wrpc/admin.setAdminRole", inflight (request) => {
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
  }
}
