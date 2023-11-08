import clsx from "clsx";

import { GithubIcon } from "../icons/github-icon.js";
import { useTimeAgo } from "../utils/time.js";
import type { App } from "../utils/wrpc.js";

export const AppCard = ({
  app,
  onClick,
}: {
  app: App;
  onClick: () => void;
}) => {
  const updatedAt = useTimeAgo(app.updatedAt);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col",
        "w-full h-full p-4 bg-white rounded-lg",
        "shadow hover:shadow-md transition-all",
        "text-left",
      )}
    >
      <div className="space-y-4 w-full">
        <div className="flex gap-x-2">
          {app.imageUrl && (
            <img src={app.imageUrl} className="w-10 h-10 rounded-full" />
          )}
          {!app.imageUrl && (
            <div className="w-10 h-10 rounded-full bg-sky-50 flex justify-center items-center">
              <div className="text-sky-600">{app.name[0]}</div>
            </div>
          )}
        </div>

        <div className="w-full truncate space-y-1">
          <div className="text-lg text-slate-800">{app.name}</div>
          <div className="text-xs text-slate-600 flex gap-x-1">
            {app.lastCommitMessage && (
              <GithubIcon className="w-4 h-4 shrink-0 text-slate-700" />
            )}
            <div className="truncate" title={app.lastCommitMessage}>
              {app.lastCommitMessage?.split("\n")[0] || app.entryfile}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full truncate text-xs mt-3 h-full items-end text-slate-600">
        {`Updated ${updatedAt} by ${app.updatedBy}`}
      </div>
    </button>
  );
};
