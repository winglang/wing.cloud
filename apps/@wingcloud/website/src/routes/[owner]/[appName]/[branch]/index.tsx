import { useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";
import { useEncodeParams } from "../../../../utils/param-encoder.js";

export const Component = () => {
  const { owner, appName, branch } = useParams();

  const encodedParams = useEncodeParams({
    owner: owner,
    appName: appName,
    branch: branch,
  });

  const branchUrl = useMemo(() => {
    return `/${encodedParams.owner}/${encodedParams.appName}/${encodedParams.branch}`;
  }, [encodedParams]);

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          {
            label: appName!,
            to: `/${encodedParams.owner}/${encodedParams.appName}`,
          },
          {
            label: branch!,
            to: branchUrl,
            icon: <BranchIcon className="size-4 text-slate-700" />,
          },
        ]}
        tabs={[
          {
            name: "Environment",
            to: branchUrl,
          },
          {
            name: "Tests",
            to: `${branchUrl}/tests`,
          },
          {
            name: "Logs",
            to: `${branchUrl}/logs`,
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
