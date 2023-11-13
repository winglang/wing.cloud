import clsx from "clsx";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationList } from "./components/app-configuration-list.js";
import {
  AppConfiguration,
  type ConfigurationType,
} from "./components/app-configuration.js";
import { CreateAppFooter } from "./components/create-app-footer.js";

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const [configurationType, setConfigurationType] =
    useState<ConfigurationType>();

  const onError = useCallback((error: Error) => {
    showNotification("Failed to create the app", {
      body: error.message,
      type: "error",
    });
  }, []);

  const onCancel = useCallback(() => {
    navigate("/apps");
  }, [navigate]);

  return (
    <div className="flex justify-center transition-all">
      <div
        className={clsx("w-full rounded shadow p-6 space-y-4", theme.bgInput)}
      >
        <div className={clsx(theme.text1, "font-semibold text-lg")}>
          Create a new App
        </div>

        <div className="gap-y-8 mb-4 flex flex-col w-full text-sm">
          <div className="w-full space-y-6">
            <AppConfigurationList
              onSetType={setConfigurationType}
              type={configurationType}
            />

            {configurationType && (
              <AppConfiguration
                type={configurationType}
                onCreateApp={() => {
                  navigate("/apps");
                }}
                onCancel={onCancel}
                onError={onError}
              />
            )}
            {!configurationType && (
              <div className="w-full flex">
                <div className="justify-end flex gap-x-2 grow">
                  <Button onClick={onCancel}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
