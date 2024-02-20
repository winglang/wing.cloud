import { useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { useEncodedParams } from "../../../utils/encoded-params.js";

export const Component = () => {
  const { owner, appName } = useParams();

  const encodedParams = useEncodedParams({
    owner: owner,
    appName: appName,
  });

  const appUrl = useMemo(() => {
    return `/${encodedParams.owner}/${encodedParams.appName}`;
  }, [encodedParams]);

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          {
            label: appName!,
            to: appUrl,
          },
        ]}
        tabs={[
          {
            name: "Application",
            to: appUrl,
          },
          {
            name: "Settings",
            to: `${appUrl}/settings`,
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
