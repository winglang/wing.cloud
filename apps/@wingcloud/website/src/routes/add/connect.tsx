import { ChevronRightIcon, LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorBoundary } from "../../components/error-boundary.js";
import { Header } from "../../components/header.js";
import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { useCreateAppFromRepo } from "../../services/create-app.js";
import { PopupWindowContext } from "../../utils/popup-window-provider.js";
import { wrpc, type Repository } from "../../utils/wrpc.js";

import { GitRepoSelect } from "./_components/git-repo-select.js";

const ConnectPage = () => {
  const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();
  const { openPopupWindow } = useContext(PopupWindowContext);

  const {
    createApp,
    listInstallationsQuery,
    listReposQuery,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    loading,
  } = useCreateAppFromRepo();

  const user = wrpc["auth.check"].useQuery();

  const subscription = wrpc["subscription"].useQuery();
  useEffect(() => {
    console.log(subscription.data);
  }, [subscription.data]);

  const [createAppLoading, setCreateAppLoading] = useState(false);

  const installationList = useMemo(() => {
    if (!listInstallationsQuery.data?.pages) {
      return [];
    }
    return listInstallationsQuery.data.pages.flatMap((page) => page.data);
  }, [listInstallationsQuery.data]);

  const reposList = useMemo(() => {
    if (!listReposQuery.data?.pages) {
      return [];
    }
    return listReposQuery.data.pages.flatMap((page) => page.data);
  }, [listReposQuery.data]);

  const selectedRepo = useMemo(() => {
    if (!reposList || !repositoryId) {
      return;
    }
    return reposList.find((repo) => repo.full_name.toString() === repositoryId);
  }, [reposList, repositoryId]);

  const onCreate = useCallback(async () => {
    if (!installationId || !selectedRepo || !user.data?.user) {
      return;
    }
    setCreateAppLoading(true);
    try {
      const app = await createApp({
        owner: user.data.user.username,
        appName: selectedRepo.name,
        description: selectedRepo.description ?? "",
        repoName: selectedRepo.name,
        repoOwner: selectedRepo.owner.login,
        defaultBranch: selectedRepo.default_branch,
      });
      //navigate(`/${app?.appFullName}`);
    } catch (error) {
      setCreateAppLoading(false);
      if (error instanceof Error) {
        showNotification("Failed to create the app", {
          body: error.message,
          type: "error",
        });
        setRepositoryId("");
      }
    }
  }, [createApp, navigate]);

  useEffect(() => {
    if (repositoryId) {
      onCreate();
    }
  }, [repositoryId]);

  // If installation id was changed, refetch repos. Needed in case the user didn't have access to any repo before.
  useEffect(() => {
    if (installationId) {
      listReposQuery.refetch();
    }
  }, [installationId]);

  return (
    <div className="space-y-4">
      <div className={clsx("flex items-center gap-1", theme.text1)}>
        Add an app
        <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
        <LinkIcon className="h-3.5 w-3.5 font-semibold" />
        <div className="truncate">Connect</div>
      </div>

      <div className="w-full space-y-2 text-sm">
        <div className={clsx(theme.text1)}>Select a repository</div>
        <div className="w-full relative space-y-2">
          {createAppLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="absolute inset-0 bg-white dark:bg-slate-900 opacity-50" />
              <SpinnerLoader className="z-20" />
            </div>
          )}

          <GitRepoSelect
            installationId={installationId}
            setInstallationId={setInstallationId}
            repositoryId={repositoryId || ""}
            setRepositoryId={setRepositoryId}
            installations={installationList}
            repos={reposList}
            loading={loading}
            disabled={createAppLoading}
          />

          <div className="text-xs flex gap-1 items-center">
            <span className={clsx(theme.text1)}>Missing a repository?</span>
            <button
              className="text-sky-600 text-left"
              onClick={() =>
                openPopupWindow({
                  url: `https://github.com/apps/${GITHUB_APP_NAME}/installations/select_target`,
                  onClose: async () => {
                    await listInstallationsQuery.refetch();
                    if (installationId) {
                      listReposQuery.refetch();
                    }
                  },
                })
              }
            >
              Adjust GitHub App Permissions
            </button>
          </div>
          <div className="w-full flex">
            <div className="justify-end flex gap-x-2 grow">
              <Button
                onClick={() => {
                  navigate("/add");
                }}
                disabled={createAppLoading}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Component = () => {
  const navigate = useNavigate();

  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <Header />
      <ErrorBoundary>
        <div
          className={clsx(
            "w-full flex-grow",
            "max-w-5xl mx-auto p-4 sm:p-6",
            "space-y-4",
          )}
        >
          <div
            className={clsx(
              "w-full rounded p-6 space-y-4 border",
              theme.bg4,
              theme.borderInput,
            )}
          >
            <ConnectPage />
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};
