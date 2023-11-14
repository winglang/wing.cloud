import { LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
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
      const app = await createApp();
      navigate(`/apps/${app?.appName}`);
    } catch (error) {
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

  const onMissingRepoClosed = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    setInstallationId(undefined);
    setInstallations([]);
    // eslint-disable-next-line unicorn/no-useless-undefined
    setRepositoryId(undefined);
    listInstallationsQuery.refetch();
  }, [listInstallationsQuery.refetch, setInstallationId, setRepositoryId]);

  return (
    <NewAppContainer
      step={{
        name: "Connect",
        icon: LinkIcon,
      }}
    >
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
          disabled={createAppLoading}
        />
        <MissingRepoButton onClose={onMissingRepoClosed} />
        <div className="w-full flex">
          <div className="justify-end flex gap-x-2 grow">
            <Button onClick={onCancel} disabled={createAppLoading}>
              Back
            </Button>
          </div>
        </div>
      </div>
    </NewAppContainer>
  );
};
