import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Button } from "../../../design-system/button.js";
import { Menu } from "../../../design-system/menu.js";
import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { MenuIcon } from "../../../icons/menu-icon.js";
import { wrpc } from "../../../utils/wrpc.js";

import { DeleteModal } from "./_components/delete-modal.js";
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

  const [loading, setLoading] = useState(false);

  const goToSettings = useCallback(async () => {
    navigate(`/${owner}/${appName}/settings`);
  }, [owner, appName]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="w-full max-w-7xl overflow-auto mx-auto space-y-4 p-4 md:p-8">
      <div className="space-y-1">
        <div className={clsx("text-2xl font-semibold", theme.text1)}>
          {appName}
        </div>
        <div className={clsx("text-sm", theme.text3)}>
          {app.isLoading && <SkeletonLoader loading className="h-4 w-1/3" />}
          {app.data?.app.description}
        </div>
      </div>

      {app.data && (
        <div className="space-y-4">
          <div
            className={clsx(
              "flex gap-x-2 rounded p-4 border",
              theme.bgInput,
              theme.borderInput,
            )}
          >
            <div className="flex grow justify-end items-end">
              <div className="flex flex-col justify-between gap-3 h-full items-end">
                <Menu
                  items={[
                    {
                      label: "Settings",
                      onClick: goToSettings,
                    },
                    {
                      label: "Delete App",
                      onClick: () => setDeleteModalOpen(true),
                    },
                  ]}
                  icon={<MenuIcon className={clsx("h-4 w-4", theme.text1)} />}
                />

                <a href={repoUrl} target="_blank">
                  <Button className="truncate" disabled={!repoUrl || loading}>
                    Git Repository
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="w-full relative">
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
      )}

      {appName && owner && (
        <DeleteModal
          owner={owner}
          appName={appName}
          show={deleteModalOpen}
          onClose={setDeleteModalOpen}
        />
      )}
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
