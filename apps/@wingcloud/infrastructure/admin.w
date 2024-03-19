bring cloud;
bring "./json-api.w" as json_api;
bring "./apps.w" as Apps;
bring "./users.w" as Users;
bring "./environments.w" as Environments;
bring "./http-error.w" as httpError;


struct AdminProps {
  api: json_api.JsonApi;
  apps: Apps.Apps;
  users: Users.Users;
  environments: Environments.Environments;
  logs: cloud.Bucket;
  getUserIdFromCookie: inflight(cloud.ApiRequest): str;
}


pub class Admin {
  new(props: AdminProps) {
    let api = props.api;
    let apps = props.apps;
    let users = props.users;
    let environments = props.environments;
    let logs = props.logs;
    let getUserIdFromCookie = props.getUserIdFromCookie;


    api.get("/wrpc/admin.users.list", inflight (request) => {
      try {
        let userId = getUserIdFromCookie(request);
        let users = users.list();

        return {
          body: {
            users: users
          },
        };
      } catch {
        throw httpError.HttpError.unauthorized();
      }
    });
  }
}
