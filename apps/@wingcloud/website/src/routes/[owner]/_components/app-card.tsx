import clsx from "clsx";

import { useTheme } from "../../../design-system/theme-provider.js";
import { TypeScriptIcon } from "../../../icons/typescript-icon.js";
import { WingIcon } from "../../../icons/wing-icon.js";
import type { App } from "../../../utils/wrpc.js";

export const AppCard = ({
  app,
  onClick,
}: {
  app: App;
  onClick: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col",
        "w-full h-full p-4 rounded-md",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
        "shadow-sm",
      )}
    >
      <div className="space-y-4 w-full">
        <div className="flex gap-x-3">
          <div className="flex items-center">
            <div
              className="w-8 h-8"
              title={app.entrypoint.endsWith(".ts") ? "TypeScript" : "Winglang"}
            >
              {app.entrypoint.endsWith(".ts") && (
                <TypeScriptIcon
                  className={clsx("w-full h-full", "text-[#2f74c0]")}
                />
              )}
              {app.entrypoint.endsWith(".w") && (
                <WingIcon className={clsx("w-full h-full", theme.text1)} />
              )}
            </div>
          </div>
          <div className="flex-grow truncate gap-y-1">
            <div className={clsx("text-base", "leading-tight", theme.text1)}>
              {app.appName}
            </div>
            <div className={clsx("text-xs flex gap-x-1", theme.text2)}>
              <div className="truncate" title={app.entrypoint}>
                {app.entrypoint}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
