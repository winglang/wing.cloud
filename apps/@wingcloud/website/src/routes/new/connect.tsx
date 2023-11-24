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
import type { Installation } from "../../utils/wrpc.js";

import { GitRepoSelect } from "./components/git-repo-select.js";
import { NewAppContainer } from "./components/new-app-container.js";

export const Component = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { showNotification } = useNotifications();

  const onError = useCallback((error: Error) => {
    showNotification("Failed to create the app", {
      body: error.message,
      type: "error",
    });
  }, []);

  const onCancel = useCallback(() => {
    navigate("/new");
  }, [navigate]);

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

  const [createAppLoading, setCreateAppLoading] = useState(false);
  const [installations, setInstallations] = useState<Installation[]>([]);

  useEffect(() => {
    if (!listInstallationsQuery.data) {
      return;
    }
    setInstallations(listInstallationsQuery.data.installations);
  }, [listInstallationsQuery.data]);

  const repos = useMemo(() => {
    if (!listReposQuery.data || installationId === "") {
      return [];
    }
    return listReposQuery.data.repositories;
  }, [listReposQuery.data]);

  const onCreate = useCallback(async () => {
    setCreateAppLoading(true);
    try {
      const app = await createApp();
      navigate(`/${app?.app.repoOwner}/${app?.app.appName}`);
    } catch (error) {
      setCreateAppLoading(false);
      if (error instanceof Error) {
        onError(error);
      }
    }
  }, [createApp, onError, navigate]);

  useEffect(() => {
    if (repositoryId) {
      onCreate();
    }
  }, [repositoryId]);

  const GITHUB_APP_NAME = import.meta.env["VITE_GITHUB_APP_NAME"];

  const openPopupWindow = usePopupWindow();

  return (
    <NewAppContainer
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
            installations={installations}
            repos={repos}
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
              <Button onClick={onCancel} disabled={createAppLoading}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </NewAppContainer>
  );
};
