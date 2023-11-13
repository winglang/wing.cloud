import { ChevronRightIcon } from "@heroicons/react/24/outline";
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

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const [configurationType, setConfigurationType] = useState<
    ConfigurationType | undefined
  >();

  const onError = useCallback((error: Error) => {
    showNotification("Failed to create the app", {
      body: error.message,
      type: "error",
    });
  }, []);

  const onCancel = useCallback(() => {
    navigate("/apps/");
  }, [navigate]);

  const resetForm = useCallback(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    setConfigurationType(undefined);
  }, []);

  return (
    <div className="flex justify-center transition-all">
      <div
        className={clsx("w-full rounded shadow p-6 space-y-4", theme.bgInput)}
      >
        <div className="flex items-center gap-1">
          <button
            className={clsx(theme.text1, "font-semibold items-center")}
            onClick={resetForm}
          >
            Create a new App
          </button>
          {configurationType && (
            <>
              <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-600" />
              <div className="font-semibold items-center opacity-80">
                {configurationType}
              </div>
            </>
          )}
        </div>

        <div className="mb-4 flex flex-col w-full text-sm">
          <div className="w-full space-y-8">
            {!configurationType && (
              <AppConfigurationList
                onSetType={setConfigurationType}
                type={configurationType}
              />
            )}

            {configurationType && (
              <AppConfiguration
                type={configurationType}
                onCreateApp={() => {
                  navigate("/apps/");
                }}
                onCancel={resetForm}
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
