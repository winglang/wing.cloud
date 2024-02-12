import clsx from "clsx";
import { useCallback, useContext, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { PageHeader } from "../../../components/page-header.js";
import { CurrentAppDataProviderContext } from "../../../data-store/app-data-provider.js";
import { Button } from "../../../design-system/button.js";
import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";

import { EnvironmentsList } from "./_components/environments-list.js";

const AppPage = ({ owner, appName }: { owner: string; appName: string }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { app, setOwner, setAppName, isLoading } = useContext(
    CurrentAppDataProviderContext,
  );
  useEffect(() => {
    setOwner(owner);
    setAppName(appName);
  }, [owner, appName]);

  const environmentsQuery = wrpc["app.listEnvironments"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );
  const environments = useMemo(() => {
    return (
      environmentsQuery.data?.environments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ) || []
    );
  }, [environmentsQuery.data]);

  const productionEnvironment = useMemo(() => {
    return environments.find((env) => env.type === "production");
  }, [environments]);

  const endpoints = wrpc["app.environment.endpoints"].useQuery(
    {
      appName: appName!,
      branch: productionEnvironment?.branch!,
    },
    {
      enabled: !!appName && !!productionEnvironment,
    },
  );

  // TODO: Gather this URL from the app data
  const repoUrl = useMemo(() => {
    if (!app) return;
    return `https://github.com/${app?.repoOwner}/${app?.repoName}`;
  }, [app]);

  const goToSettings = useCallback(async () => {
    navigate(`/${owner}/${appName}/settings`);
  }, [owner, appName]);

  return (
    <>
      <PageHeader
        title="App Details"
        description={
          <div className="flex gap-x-2">
            <div className={clsx(theme.text2)}>{appName}</div>
            {!isLoading && <div>-</div>}
            <div className="w-full">
              {isLoading && <SkeletonLoader className="h-5 w-3/5" loading />}
              {!isLoading && (app?.description || "No description.")}
            </div>
          </div>
        }
        actions={
          <>
            <a href={repoUrl} target="_blank">
              <Button className="truncate" disabled={!repoUrl}>
                Git Repository
              </Button>
            </a>
            <Button
              onClick={goToSettings}
              disabled={isLoading}
              className="truncate"
            >
              Settings
            </Button>
          </>
        }
      />
      <div className="overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-2 md:px-8 md:py:4">
          {owner && appName && (
            <EnvironmentsList
              endpoints={endpoints.data?.endpoints || []}
              environments={environments}
              loading={environmentsQuery.isLoading}
              endpointsLoading={endpoints.isLoading}
              owner={owner}
              appName={appName}
              repoUrl={repoUrl || ""}
            />
          )}
        </div>
      </div>
    </>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return (
    <div className="flex flex-col h-full">
      <Header breadcrumbs={[{ label: appName!, to: `/${owner}/${appName}` }]} />
      <ErrorBoundary>
        <AppPage owner={owner!} appName={appName!} />
      </ErrorBoundary>
    </div>
  );
};
