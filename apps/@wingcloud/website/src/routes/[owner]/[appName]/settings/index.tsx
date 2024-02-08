import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { Outlet, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../../components/error-boundary.js";
import { Header } from "../../../../components/header.js";
import { SideBarNav } from "../../../../design-system/sidebar-nav.js";
import { useTheme } from "../../../../design-system/theme-provider.js";

const SettingsPage = ({
  owner,
  appName,
}: {
  owner: string;
  appName: string;
}) => {
  const { theme } = useTheme();

  return (
    <>
      <div className={clsx("border-b", theme.border4, theme.bg4)}>
        <div className="w-full max-w-7xl overflow-auto mx-auto p-4 md:p-8 flex">
          <div className="space-y-1 flex-grow truncate">
            <div className={clsx("text-2xl font-semibold", theme.text1)}>
              Project Settings
            </div>
            <div className={clsx("text-sm w-full truncate h-5", theme.text3)}>
              {appName}
            </div>
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "w-full max-w-7xl overflow-auto h-full mx-auto",
          "gap-x-4 md:gap-x-8",
          "p-4 md:p-8",
          "flex",
        )}
      >
        <div className="w-40">
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
        <div className="flex-grow">
          <Outlet />
        </div>
      </div>
    </>
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
        <SettingsPage owner={owner!} appName={appName!} />
      </ErrorBoundary>
    </div>
  );
};
