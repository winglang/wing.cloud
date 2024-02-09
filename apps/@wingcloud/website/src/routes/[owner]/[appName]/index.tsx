import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { PageHeader } from "../../../components/page-header.js";
import { Button } from "../../../design-system/button.js";
import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";

import { EnvironmentsList } from "./_components/environments-list.js";

const AppPage = ({ owner, appName }: { owner: string; appName: string }) => {
  const { theme } = useTheme();

  const navigate = useNavigate();

  const app = wrpc["app.getByName"].useQuery({
    owner,
    appName,
  });

  const environmentsQuery = wrpc["app.listEnvironments"].useQuery({
    owner,
    appName,
  });
  const environments = useMemo(() => {
    return (
      environmentsQuery.data?.environments.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ) || []
    );
  }, [environmentsQuery.data]);

  // TODO: Gather this URL from the app data
  const repoUrl = useMemo(() => {
    if (!app.data) return;
    return `https://github.com/${app.data?.app.repoOwner}/${app.data?.app.repoName}`;
  }, [app.data]);

  const goToSettings = useCallback(async () => {
    navigate(`/${owner}/${appName}/settings`);
  }, [owner, appName]);

  return (
    <div className="overflow-auto">
      <PageHeader
        title={appName}
        description={
          app.isLoading ? (
            <SkeletonLoader className="h-5 w-1/3" loading />
          ) : (
            app.data?.app.description
          )
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
              disabled={app.isLoading}
              className="truncate"
            >
              Settings
            </Button>
          </>
        }
      />

      <div className="w-full max-w-7xl overflow-auto mx-auto px-4 py-2 md:px-8 md:py:4">
        {owner && appName && (
          <EnvironmentsList
            environments={environments}
            loading={environmentsQuery.isLoading}
            owner={owner}
            appName={appName}
            repoUrl={repoUrl || ""}
          />
        )}
      </div>
    </div>
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
