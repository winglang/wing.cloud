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
    <NewAppContainer step="connect">
      <div className="w-full space-y-2">
        <div className={clsx(theme.text1)}>Select a repository</div>
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
    </NewAppContainer>
  );
};
