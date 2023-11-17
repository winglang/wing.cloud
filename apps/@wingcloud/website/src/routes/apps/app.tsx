import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { Menu } from "../../design-system/menu.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { GithubIcon } from "../../icons/github-icon.js";
import { MenuIcon } from "../../icons/menu-icon.js";
import { wrpc } from "../../utils/wrpc.js";

import { DeleteModal } from "./components/delete-modal.js";
import { EnvironmentsList } from "./components/environments-list.js";

export interface AppProps {
  appName: string;
}

export const Component = () => {
  const { theme } = useTheme();

  const { appName } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const appQuery = wrpc["app.getByName"].useQuery({ appName: appName! });

  const app = useMemo(() => {
    return appQuery.data?.app;
  }, [appQuery.data]);

  const environmentsQuery = wrpc["app.environments"].useQuery(
    { appId: app?.appId! },
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

  const deleteAppMutation = wrpc["app.delete"].useMutation();
  const deleteApp = useCallback(async () => {
    try {
      setLoading(true);
      await deleteAppMutation.mutateAsync({ appId: app?.appId! });
      navigate("/apps/");
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        showNotification("Failed to delete the app", {
          body: error.message,
          type: "error",
        });
      }
    }
  }, [app?.appId, deleteAppMutation]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto py-4 px-4 sm:px-6 sm:py-6 transition-all">
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
            <img src={app.imageUrl} alt="" className="w-14 h-14 rounded-full" />
            <div className="space-y-1 pt-2 truncate ml-2">
              <div
                className={clsx("text-xl self-center truncate", theme.text1)}
              >
                {app.appName}
              </div>
              <div
                className={clsx("text-xs self-center truncate", theme.text2)}
              >
                {app.description === "" ? (
                  <div className="space-x-1 flex items-center truncate">
                    <GithubIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate" title={app.lastCommitMessage}>
                      {app.lastCommitMessage?.split("\n")[0]}
                    </span>
                  </div>
                ) : (
                  app.description
                )}
              </div>
            </div>

            <div className="flex grow justify-end items-end">
              <div className="flex flex-col justify-between gap-3 h-full items-end">
                <Menu
                  items={[
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
                  className={clsx("absolute inset-0 opacity-50", theme.bgInput)}
                />
                <SpinnerLoader size="sm" className="z-20" />
              </div>
            )}
            <EnvironmentsList
              environments={environments}
              loading={environmentsQuery.isLoading}
              appName={app.appName}
              repoUrl={repoUrl}
            />
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
  );
};
