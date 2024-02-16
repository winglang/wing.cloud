import { Link, Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { PageHeader } from "../../../components/page-header.js";
import { Button } from "../../../design-system/button.js";
import { wrpc } from "../../../utils/wrpc.js";
import { useMemo } from "react";
import clsx from "clsx";
import { useTheme } from "../../../design-system/theme-provider.js";

export const Component = () => {
  const { owner, appName } = useParams();
  const { theme } = useTheme();

  const getAppQuery = wrpc["app.getByName"].useQuery(
    {
      owner: owner!,
      appName: appName!,
    },
    {
      enabled: !!owner && !!appName,
    },
  );
  const app = useMemo(() => {
    return getAppQuery.data?.app;
  }, [getAppQuery.data]);

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[{ label: appName!, to: `/${owner}/${appName}` }]}
        tabs={[
          {
            name: "Application",
            to: `/${owner}/${appName}`,
          },
          {
            name: "Settings",
            to: `/${owner}/${appName}/settings`,
          },
        ]}
      />
      <ErrorBoundary>
        <PageHeader
          title={appName}
          actions={
            <Link
              to={`https://github.com/${app?.repoOwner}/${app?.repoName}`}
              target="_blank"
            >
              <Button disabled={!app}>Git Repository</Button>
            </Link>
          }
        />
        <div className="overflow-auto">
          <div
            className={clsx(
              "py-4",
              "relative transition-all",
              theme.pageMaxWidth,
              theme.pagePadding,
            )}
          >
            <Outlet />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
