import clsx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppConfigurationList } from "../components/app-configuration-list.js";
import { ConnectRepoSettings } from "../components/connect-repo-settings.js";
import { Button } from "../design-system/button.js";
import { useTheme } from "../design-system/theme-provider.js";
import {
  useCreateFromRepoApp,
  type ConfigurationType,
} from "../services/create-app.js";

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [configurationType, setConfigurationType] =
    useState<ConfigurationType>("connect");

  const {
    createApp,
    installations,
    repos,
    installationId,
    setInstallationId,
    repositoryId,
    setRepositoryId,
    loadingRepositories,
    createApploading,
    disabled,
  } = useCreateFromRepoApp({
    configurationType,
  });

  return (
    <>
      <div className="flex justify-center md:pt-10 max-w-2xl mx-auto transition-all">
        <div
          className={clsx(
            "w-full rounded-lg shadow-xl border p-6 space-y-4",
            theme.bgInput,
          )}
        >
          <div className={clsx(theme.text1, "font-semibold text-lg")}>
            Create a new App
          </div>

          <div className="gap-y-8 mb-4 flex flex-col w-full text-sm">
            <div className="w-full space-y-2">
              <div className={clsx(theme.text2)}></div>
              <AppConfigurationList
                onSetType={setConfigurationType}
                type={configurationType}
              />
            </div>

            {configurationType === "connect" && (
              <ConnectRepoSettings
                installations={installations}
                repos={repos}
                installationId={installationId}
                setInstallationId={setInstallationId}
                repositoryId={repositoryId}
                setRepositoryId={setRepositoryId}
                loading={loadingRepositories}
              />
            )}
          </div>
          <div className="w-full flex">
            <div className="justify-end flex gap-x-2 grow">
              <Button
                onClick={() => {
                  navigate("/apps");
                }}
              >
                Cancel
              </Button>
              <Button onClick={createApp} primary disabled={disabled}>
                {createApploading ? "Creating..." : "Create new App"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
