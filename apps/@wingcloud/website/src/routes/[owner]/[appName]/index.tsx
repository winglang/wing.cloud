import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";

export const Component = () => {
  const { owner, appName } = useParams();

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
          <div className="max-w-7xl mx-auto p-4 md:p-8 relative">
            <Outlet />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
