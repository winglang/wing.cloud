import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { useCreateAppFromRepo } from "../../services/create-app.js";
import type { Installation } from "../../utils/wrpc.js";

import { CreateAppFooter } from "./components/create-app-footer.js";
import { GitRepoSelect } from "./components/git-repo-select.js";
import { MissingRepoButton } from "./components/missing-repo-button.js";

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const onError = useCallback((error: Error) => {
    showNotification("Failed to create the app", {
      body: error.message,
      type: "error",
    });
  }, []);

  const onAppCreated = useCallback(() => {
    navigate("/apps/");
  }, [navigate]);

  const onCancel = useCallback(() => {
    navigate("/apps/new");
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
    createAppLoading,
  } = useCreateAppFromRepo();

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
    try {
      await createApp();
      onAppCreated();
    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      }
    }
  }, [createApp, onAppCreated, onError]);

  const onMissingRepoClosed = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    setInstallationId(undefined);
    setInstallations([]);
    // eslint-disable-next-line unicorn/no-useless-undefined
    setRepositoryId(undefined);
    listInstallationsQuery.refetch();
  }, [listInstallationsQuery.refetch, setInstallationId, setRepositoryId]);

  return (
    <div className="flex justify-center transition-all">
      <div
        className={clsx("w-full rounded shadow p-6 space-y-4", theme.bgInput)}
      >
        <div className="flex items-center gap-1">
          <button
            className={clsx(theme.text1, "font-semibold items-center")}
            onClick={onCancel}
          >
            Create a new App
          </button>
          <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-600" />
          <div className="font-semibold items-center">Connect</div>
        </div>

        <div className="mb-4 flex flex-col w-full text-sm">
          <div className="w-full space-y-2">
            <div className={clsx(theme.text1)}>Select a Git Repository</div>
            <GitRepoSelect
              installationId={installationId}
              setInstallationId={setInstallationId}
              repositoryId={repositoryId || ""}
              setRepositoryId={setRepositoryId}
              installations={installations}
              repos={repos}
              loading={loading}
            />
            <MissingRepoButton onClose={onMissingRepoClosed} />
            <CreateAppFooter
              onCancel={onCancel}
              onCreate={onCreate}
              disabled={!repositoryId}
              loading={createAppLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
