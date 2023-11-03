import clsx from "clsx";

import { GithubIcon } from "../icons/github-icon.js";
import type { App } from "../utils/wrpc.js";

const getDateTime = (datetime: string) => {
  const date = new Date(datetime);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

const getTimeFromNow = (datetime: string) => {
  const date = new Date(datetime);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 24) {
    return getDateTime(datetime);
  }

  if (hours > 0) {
    return `${hours} hours ago`;
  }

  if (minutes > 0) {
    return `${minutes} minutes ago`;
  }

  return `${seconds} seconds ago`;
};

export const AppCard = ({
  app,
  onClick,
}: {
  app: App;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col",
        "w-full h-full p-4 bg-white rounded-lg",
        "shadow hover:shadow-md transition-all",
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

        <div className="text-left w-full truncate space-y-1">
          <div className="text-lg text-slate-800">{app.name}</div>
          <div className="text-xs text-slate-600 flex gap-x-1">
            {app.description && <GithubIcon className="w-4 text-slate-700" />}
            <div className="truncate">{app.description || app.entryfile}</div>
          </div>
        </div>
      </div>

      <div className="text-xs mt-3 h-full flex items-end">
        <div className="text-slate-600">
          Updated {getTimeFromNow(app.updatedAt)}{" "}
          {app.updatedBy && `by ${app.updatedBy}`}
        </div>
      </div>
    </button>
  );
};
