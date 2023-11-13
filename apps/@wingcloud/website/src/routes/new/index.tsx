import clsx from "clsx";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationList } from "./components/app-configuration-list.js";
import {
  AppConfiguration,
  type ConfigurationType,
} from "./components/app-configuration.js";

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const [configurationType, setConfigurationType] =
    useState<ConfigurationType>("connect");

  const onError = useCallback((error: Error) => {
    showNotification("Failed to create the app", {
      body: error.message,
      type: "error",
    });
  }, []);

  return (
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
            <AppConfiguration
              type={configurationType}
              onCreateApp={() => {
                navigate("/apps");
              }}
              onCancel={() => {
                navigate("/apps");
              }}
              onError={(error: Error) => {
                showNotification("Failed to create the app", {
                  body: error.message,
                  type: "error",
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
