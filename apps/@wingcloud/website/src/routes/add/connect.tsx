import { LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SpinnerLoader } from "../../components/spinner-loader.js";
import { Button } from "../../design-system/button.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { useCreateAppFromRepo } from "../../services/create-app.js";
import { usePopupWindow } from "../../utils/popup-window.js";
import { wrpc } from "../../utils/wrpc.js";

import { AddAppContainer } from "./_components/add-app-container.js";
import { GitRepoSelect } from "./_components/git-repo-select.js";

export const Component = () => {
  const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

  const { theme } = useTheme();
  const navigate = useNavigate();
  const openPopupWindow = usePopupWindow();
  const { showNotification } = useNotifications();

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

  const [createAppLoading, setCreateAppLoading] = useState(false);

  const selectedRepo = useMemo(() => {
    if (!listReposQuery.data?.repositories || !repositoryId) {
      return;
    }
    return listReposQuery.data?.repositories.find(
      (repo) => repo.full_name.toString() === repositoryId,
    );
  }, [listReposQuery.data?.repositories, repositoryId]);

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
        installationId,
      });
      navigate(`/${app?.appFullName}`);
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

  return (
    <AddAppContainer
      step={{
        name: "Connect",
        icon: LinkIcon,
      }}
    >
      <div className="w-full space-y-2">
        <div className={clsx(theme.text1)}>Select a repository</div>
        <div className="w-full relative space-y-2">
          {createAppLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="absolute inset-0 bg-white dark:bg-gray-900 opacity-50" />
              <SpinnerLoader className="z-20" />
            </div>
          )}
          <GitRepoSelect
            installationId={installationId}
            setInstallationId={setInstallationId}
            repositoryId={repositoryId || ""}
            setRepositoryId={setRepositoryId}
            installations={listInstallationsQuery.data?.installations ?? []}
            repos={listReposQuery.data?.repositories ?? []}
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
                  onClose: () => {
                    listInstallationsQuery.refetch();
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
    </AddAppContainer>
  );
};
