import { Link, Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { wrpc } from "../../../utils/wrpc.js";
import { useMemo } from "react";
import clsx from "clsx";
import { useTheme } from "../../../design-system/theme-provider.js";

export const Component = () => {
  const { owner, appName } = useParams();
  const { theme } = useTheme();

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
        <div className="overflow-auto">
          <Outlet />
        </div>
      </ErrorBoundary>
    </div>
  );
};
