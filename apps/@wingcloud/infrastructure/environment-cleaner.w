bring cloud;
bring "./apps.w" as apps;
bring "./environments.w" as environments;
bring "./environment-manager.w" as environment_manager;
bring "./node_modules/@wingcloud/dateutils/index.w" as dateutils;

pub struct EnvironmentCleanerProps {
  apps: apps.Apps;
  environments: environments.Environments;
  environmentManager: environment_manager.EnvironmentManager;
}

pub class EnvironmentCleaner {
  environments: environments.Environments;

  new(props: EnvironmentCleanerProps) {
    this.environments = props.environments;

    let cleaner = new cloud.Schedule(rate: 10m);
    cleaner.onTick(inflight () => {
      let expiredDate = datetime.fromIso(dateutils.addDays(datetime.utcNow().toIso(), -7));
      for environment in this.environments.listDeployedAt(deployedAt: expiredDate) {
        if environment.type != "production" {
          log("cleaning environment {Json.stringify(environment)}");
          let app = props.apps.get(appId: environment.appId);
          props.environmentManager.stop(appId: environment.appId, appName: app.appName, environment: environment);
        }
      }
    });
  }
}
