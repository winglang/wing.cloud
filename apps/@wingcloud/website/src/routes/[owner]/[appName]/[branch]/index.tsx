import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";

export const Component = () => {
  const { owner, appName, branch } = useParams();
  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          { label: appName!, to: `/${owner}/${appName}` },
          {
            label: branch!,
            to: `/${owner}/${appName}/${branch}`,
            icon: <BranchIcon className="w-4 h-4 text-slate-700" />,
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
          <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
            <Outlet />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
