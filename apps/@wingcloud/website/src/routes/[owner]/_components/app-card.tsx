import clsx from "clsx";
import { useMemo, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Menu } from "../../../design-system/menu.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import { GithubIcon } from "../../../icons/github-icon.js";
import { MenuIcon } from "../../../icons/menu-icon.js";
import { useTimeAgo } from "../../../utils/time.js";
import type { App } from "../../../utils/wrpc.js";

import { AppIcon } from "./app-icon.js";

export const AppCard = ({
  app,
  owner,
  onOpenConsole,
  onOpenLogs,
  onOpenSettings,
  onOpenApp,
}: {
  app: App;
  owner: string;
  onOpenConsole: (event: MouseEvent) => void;
  onOpenSettings: (event: MouseEvent) => void;
  onOpenLogs: (event: MouseEvent) => void;
  onOpenApp: () => void;
}) => {
  const { theme } = useTheme();
  const timeAgo = useTimeAgo(app.lastCommitDate || Date.now().toString(), true);
  const navigate = useNavigate();

  const projectUrl = useMemo(() => {
    return `https://github.com/${app.repoOwner}/${app.repoName}`;
  }, [app]);

  const branchUrl = useMemo(() => {
    return `https://github.com/${app.repoOwner}/${app.repoName}/tree/${app.defaultBranch}`;
  }, [app]);

  const commitUrl = useMemo(() => {
    if (!app.lastCommitSha) {
      return;
    }
    return `https://github.com/${app.repoOwner}/${app.repoName}/commit/${app.lastCommitSha}`;
  }, [app]);

  return (
    <button
      className={clsx(
        "w-full h-full rounded-md",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
        "shadow-sm hover:shadow",
      )}
      onClick={onOpenApp}
    >
      <div
        className={clsx(
          "flex items-center gap-x-4 p-4 rounded-t-md",
          theme.bg4,
          "border-b",
          "theme.borderInput",
        )}
      >
        <AppIcon app={app} />
        <div
          className={clsx(
            "text-sm font-medium leading-6",
            theme.text1,
            theme.text1Hover,
            "hover:underline",
          )}
        >
          {app.appName}
        </div>
        <div className="flex flex-grow justify-end">
          <Menu
            icon={
              <MenuIcon
                className={clsx(
                  "w-6 h-6 p-1 rounded",
                  theme.text2,
                  theme.bgInputHover,
                )}
              />
            }
            btnClassName=" flex"
            onClick={(event) => event.stopPropagation()}
            items={[
              {
                label: "View on Console",
                onClick: onOpenConsole,
              },
              {
                label: "View Logs",
                onClick: onOpenLogs,
              },
              {
                label: "Settings",
                onClick: onOpenSettings,
              },
            ]}
          />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="leading-6 space-y-1">
          <div className="flex justify-between gap-x-4">
            <div className="flex gap-x-2 truncate">
              <Link
                className={clsx(
                  "truncate",
                  "text-xs",
                  theme.text2,
                  theme.text2Hover,
                  "hover:underline",
                  "font-medium",
                )}
                onClick={(event) => event.stopPropagation()}
                target="_blank"
                to={projectUrl}
              >
                <div className="flex gap-x-2 truncate items-center">
                  <GithubIcon className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    {app.repoOwner}/{app.repoName}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
        <div className="leading-6 space-y-1">
          <div className="flex justify-between gap-x-4">
            <div className="flex gap-x-2 truncate">
              <Link
                aria-disabled={!commitUrl}
                className={clsx(
                  "truncate",
                  "text-xs",
                  theme.text3,
                  theme.text3Hover,
                  "hover:underline",
                )}
                target="_blank"
                to={commitUrl || ""}
                onClick={(event) => event.stopPropagation()}
                title="View commit on GitHub"
              >
                {app.lastCommitMessage || "View on GitHub"}
              </Link>
            </div>
          </div>
          <div className="flex justify-between gap-x-4">
            <div className="flex gap-x-1 truncate">
              <div className={clsx("text-xs", theme.text4)}>{timeAgo} on</div>
              <div className={clsx("flex text-xs truncate", theme.text2)}>
                <BranchIcon className="w-4 h-4 shrink-0" />
                <Link
                  className={clsx(
                    "truncate",
                    "text-xs",
                    theme.text2Hover,
                    "hover:underline",
                  )}
                  target="_blank"
                  to={branchUrl}
                  onClick={(event) => event.stopPropagation()}
                >
                  {app.defaultBranch}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
