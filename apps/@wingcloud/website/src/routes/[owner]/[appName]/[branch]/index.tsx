import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
export const Component = () => {
  const { owner, appName, branch } = useParams();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          {
            label: appName!,
            to: `/${owner}/${appName}`,
          },
          {
            label: branch!,
            to: `/${owner}/${appName}/${branch}`,
            icon: <BranchIcon className="size-4 text-slate-700" />,
          },
        ]}
        tabs={[
          {
            name: "Environment",
            to: `/${owner}/${appName}/${branch}`,
          },
          {
            name: "Tests",
            to: `/${owner}/${appName}/${branch}/tests`,
          },
          {
            name: "Logs",
            to: `/${owner}/${appName}/${branch}/logs`,
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
