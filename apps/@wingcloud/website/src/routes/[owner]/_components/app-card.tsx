import clsx from "clsx";

import { useTheme } from "../../../design-system/theme-provider.js";
import { GithubIcon } from "../../../icons/github-icon.js";
import { useTimeAgo } from "../../../utils/time.js";
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
        "w-full h-full p-4 rounded",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <div className="space-y-4 w-full">
        <div className="w-full truncate space-y-1">
          <div className={clsx("text-lg", theme.text1)}>{app.appName}</div>
          <div className={clsx("text-xs flex gap-x-1", theme.text2)}>
            <div className="truncate" title={app.entryfile}>
              {app.entryfile}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
