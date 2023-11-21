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

  const updatedAt = useTimeAgo(app.updatedAt);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col",
        "w-full h-full p-4 rounded-lg",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <div className="space-y-4 w-full">
        <div className="flex gap-x-2">
          {app.imageUrl && (
            <img src={app.imageUrl} className="w-10 h-10 rounded-full" />
          )}
          {!app.imageUrl && (
            <div className="w-10 h-10 rounded-full bg-sky-50 flex justify-center items-center">
              <div className={clsx(theme.text1)}>{app.appName[0]}</div>
            </div>
          )}
        </div>

        <div className="w-full truncate space-y-1">
          <div className={clsx("text-lg", theme.text1)}>{app.appName}</div>
          <div className={clsx("text-xs flex gap-x-1", theme.text2)}>
            {app.lastCommitMessage && (
              <GithubIcon className={clsx("h-4 w-4 shrink-0", theme.text1)} />
            )}
            <div className="truncate" title={app.lastCommitMessage}>
              {app.lastCommitMessage?.split("\n")[0] || app.entryfile}
            </div>
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "w-full truncate text-xs mt-3 h-full items-end",
          theme.text2,
        )}
      >
        {`Updated ${updatedAt} by ${app.updatedBy}`}
      </div>
    </button>
  );
};
