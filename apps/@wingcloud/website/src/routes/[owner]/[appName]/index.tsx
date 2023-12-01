import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorBoundary } from "../../../components/error-boundary.js";
import { Header } from "../../../components/header.js";
import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Button } from "../../../design-system/button.js";
import { Menu } from "../../../design-system/menu.js";
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

  const environmentsQuery = wrpc["app.listEnvironments"].useQuery(
    { owner, appName },
    {
      // TODO: query invalidation
      refetchInterval: 1000 * 10,
    },
  );
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
    <div
      className={clsx(
        "w-full flex-grow overflow-auto",
        "max-w-5xl mx-auto p-4 sm:p-6",
      )}
    >
      {app.isLoading && (
        <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <SpinnerLoader />
        </div>
      )}

      {app.data && (
        <div className="space-y-4">
          <div
            className={clsx(
              "flex gap-x-2 rounded p-4 border",
              theme.bgInput,
              theme.borderInput,
            )}
          >
            <div className="truncate flex flex-col justify-between">
              <div className={clsx("text-xl truncate", theme.text1)}>
                {appName}
              </div>
              <div className={clsx("text-xs truncate", theme.text2)}>
                {app.data.app.description}
              </div>
            </div>

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
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div
                  className={clsx(
                    "absolute inset-0 opacity-50 rounded",
                    theme.bgInput,
                  )}
                />
                <SpinnerLoader className="z-20" />
              </div>
            )}
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
      <Header />
      <ErrorBoundary>
        <AppPage owner={owner!} appName={appName!} />
      </ErrorBoundary>
    </div>
  );
};
