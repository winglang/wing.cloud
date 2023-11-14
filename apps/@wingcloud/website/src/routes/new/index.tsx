import clsx from "clsx";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../design-system/button.js";
import { useTheme } from "../../design-system/theme-provider.js";

import { AppConfigurationList } from "./components/app-configuration-list.js";

export const Component = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const onCancel = useCallback(() => {
    navigate("/apps/new");
  }, [navigate]);

  const onSetType = useCallback(
    (type: string) => {
      navigate(`/apps/new/${type}`);
    },
    [navigate],
  );

  return (
    <div className="flex justify-center transition-all">
      <div
        className={clsx("w-full rounded shadow p-6 space-y-4", theme.bgInput)}
      >
        <div className="flex font-semibold items-center gap-1">
          Create a new App
        </div>

        <div className="mb-4 flex flex-col w-full text-sm">
          <div className="w-full space-y-8">
            <AppConfigurationList onSetType={onSetType} />
            <div className="w-full flex">
              <div className="justify-end flex gap-x-2 grow">
                <Button onClick={onCancel}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
