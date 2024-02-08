import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { SideBarNav } from "../../../../design-system/sidebar-nav.js";

const SettingsPage = () => {
  const { owner, appName } = useParams();

  return (
    <div className="flex w-full overflow-auto h-full">
      <div className="pl-4 py-4 sm:pl-6 sm:py-6">
        <SideBarNav
          items={[
            { label: "Overview", to: `/${owner}/${appName}/settings` },
            {
              label: "Entrypoints",
              to: `/${owner}/${appName}/settings/entrypoints`,
            },
            {
              label: "Secrets",
              to: `/${owner}/${appName}/settings/secrets`,
            },
          ]}
        />
      </div>
      <div
        className={clsx(
          "w-full flex-grow overflow-auto",
          "max-w-7xl mx-auto p-4 sm:p-6",
        )}
      >
        <Outlet />
      </div>
    </div>
  );
};

export const Component = () => {
  const { owner, appName } = useParams();

  return (
    <div className="flex flex-col h-full">
      <Header
        breadcrumbs={[
          { label: appName!, to: `/${owner}/${appName}` },
          {
            label: "Settings",
            to: `/${owner}/${appName}/settings`,
            icon: <Cog6ToothIcon className="w-4 h-4 text-slate-500" />,
          },
        ]}
      />
      <ErrorBoundary>
        <SettingsPage />
      </ErrorBoundary>
    </div>
  );
};
