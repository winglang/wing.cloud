import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { Menu } from "../../design-system/menu.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { MenuIcon } from "../../icons/menu-icon.js";
import { wrpc } from "../../utils/wrpc.js";

import { DeleteModal } from "./components/delete-modal.js";
import { EnvironmentsList } from "./components/environments-list.js";

export interface AppProps {
  appName: string;
}

export const Component = () => {
  const { theme } = useTheme();

  const { owner, appName } = useParams();
  const navigate = useNavigate();

  const appQuery = wrpc["app.getByName"].useQuery({
    owner: owner!,
    appName: appName!,
  });

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

  const environmentsQuery = wrpc["app.environments"].useQuery(
    { owner: owner!, appId: app?.appId! },
    {
      enabled: app !== undefined,
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

  const repositoryQuery = wrpc["github.getRepository"].useQuery(
    {
      owner: app?.repoOwner || "",
      repo: app?.repoName || "",
    },
    {
      enabled: app != undefined,
    },
  );
  const repoUrl = useMemo(() => {
    return repositoryQuery.data?.repository.html_url || "";
  }, [repositoryQuery.data]);

  const [loading, setLoading] = useState(false);

  const goToSettings = useCallback(async () => {
    navigate(`/${owner}/${app?.appName}/settings`);
  }, [app?.appName]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <Header />
      <div
        className={clsx(
          "w-full flex-grow overflow-auto",
          "max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6",
        )}
      >
        {!app && (
          <div className="absolute z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <SpinnerLoader />
          </div>
        )}

        {app && (
          <div className="space-y-4">
            <div
              className={clsx(
                "flex gap-x-2 rounded p-4 border",
                theme.bgInput,
                theme.borderInput,
              )}
            >
              <div className="space-y-1 pt-2 truncate ml-2">
                <div
                  className={clsx("text-xl self-center truncate", theme.text1)}
                >
                  {app.appName}
                </div>
                <div
                  className={clsx("text-xs self-center truncate", theme.text2)}
                >
                  {app.description}
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
                  repoUrl={repoUrl}
                />
              )}
            </div>
          </div>
        )}

        {appName && app?.appId && (
          <DeleteModal
            appId={app.appId}
            appName={appName}
            show={deleteModalOpen}
            onClose={setDeleteModalOpen}
          />
        )}
      </div>
    </div>
  );
};
