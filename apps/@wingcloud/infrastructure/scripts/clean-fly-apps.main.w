bring cloud;
bring util;
bring "../flyio" as flyio;

let flyToken = util.env("FLY_TOKEN");
let flyOrgSlug = util.env("FLY_ORG_SLUG");

new cloud.Function(inflight () => {
  let aWeekAgo = datetime.utcNow().timestampMs - (7 * 24 * 60 * 60 * 1000);
  let flyClient = new flyio.Client(token: flyToken, orgSlug: flyOrgSlug);
  let fly = new flyio.Fly(flyClient);
  let apps = fly.listApps();
  log("total apps: {apps.length}. a week ago: {aWeekAgo}");
  for app in apps {
    if aWeekAgo >= app.createdAt().timestampMs {
      log("deleting app {app.props.name}: {app.createdAt().toIso()}");
      app.destroy();
    }
  }
}) as "clean apps";
