import { Cog8ToothIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { CommandLineIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { StatusPill } from "../../../components/status-pill.js";
import { Menu } from "../../../design-system/menu.js";
import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import { GithubIcon } from "../../../icons/github-icon.js";
import { MenuIcon } from "../../../icons/menu-icon.js";
import { useTimeAgo } from "../../../utils/time.js";
import type { App } from "../../../utils/wrpc.js";
import { GitHubLink } from "../[appName]/_components/github-link.js";

import { AppIcon } from "./app-icon.js";

export const AppCard = ({ app, owner }: { app: App; owner: string }) => {
  const { theme } = useTheme();

  const timeAgo = useTimeAgo(app.lastCommitDate, true);
  const navigate = useNavigate();

  const branchUrl = useMemo(() => {
    if (!app.defaultBranch) {
      return `https://github.com/${app.repoOwner}/${app.repoName}`;
    }
    return `https://github.com/${app.repoOwner}/${app.repoName}/tree/${app.defaultBranch}`;
  }, [app]);

  const commitUrl = useMemo(() => {
    if (!app.lastCommitSha) {
      return `https://github.com/${app.repoOwner}/${app.repoName}`;
    }
    return `https://github.com/${app.repoOwner}/${app.repoName}/commit/${app.lastCommitSha}`;
  }, [app]);

  return (
    <div
      className={clsx(
        "w-full h-full rounded-md",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
        "transition-all",
        "shadow-sm hover:shadow",
        "relative",
      )}
    >
      <Link
        className={clsx("absolute inset-0 rounded-md z-0", theme.focusVisible)}
        to={`/${owner}/${app.appName}`}
      />

      <div
        className={clsx(
          "flex items-center gap-x-4 p-4 rounded-t-md",
          theme.bg4,
          theme.borderInput,
          "border-b",
        )}
      >
        <AppIcon
          appName={app.appName}
          entrypoint={app.entrypoint}
          classNames="size-8"
        />
        <Link
          className={clsx(
            "text-sm font-medium leading-6",
            theme.text1,
            theme.text1Hover,
            "hover:underline z-10 cursor-pointer",
            "truncate",
            theme.focusVisible,
          )}
          to={`/${owner}/${app.appName}`}
        >
          {app.appName}
        </Link>

        <div className="flex flex-grow justify-end">
          <Menu
            icon={
              <MenuIcon
                className={clsx(
                  "w-6 h-6",
                  "transition-all",
                  "p-1 rounded-sm",
                  theme.text2,
                  theme.bgInputHover,
                )}
              />
            }
            btnClassName="flex z-10"
            onClick={(event) => event.stopPropagation()}
            items={[
              {
                label: "Logs",
                icon: <DocumentTextIcon className="size-4" />,
                disabled: !app.defaultBranch,
                link: `/${owner}/${app.appName}/logs/${app.defaultBranch}`,
              },
              {
                label: "Console",
                icon: <CommandLineIcon className="size-4" />,
                disabled: app.status !== "running" || !app.defaultBranch,
                link: `/${owner}/${app.appName}/console/${app.defaultBranch}`,
              },

              {
                label: "Settings",
                icon: <Cog8ToothIcon className="size-4" />,
                link: `/${owner}/${app.appName}/settings`,
              },
            ]}
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex grow gap-x-2">
          <GitHubLink app={app} />
          <div className="flex grow justify-end">
            {app.status && <StatusPill status={app.status} />}
          </div>
        </div>

        <div className="leading-6 space-y-1">
          <div className="flex justify-between gap-x-4">
            <div className="flex gap-x-2 truncate w-full">
              {app.lastCommitMessage && (
                <Link
                  className={clsx(
                    "truncate",
                    "text-xs",
                    theme.text3,
                    theme.text3Hover,
                    "focus:underline hover:underline z-10 outline-none",
                  )}
                  target="_blank"
                  to={commitUrl}
                  onClick={(event) => event.stopPropagation()}
                  title="View commit on GitHub"
                >
                  {app.lastCommitMessage}
                </Link>
              )}
              {app.status === "initializing" && !app.lastCommitMessage && (
                <SkeletonLoader className="h-4 w-2/3" loading />
              )}
              {app.status !== "initializing" && !app.lastCommitMessage && (
                <div className={clsx("text-xs", theme.text4)}>
                  No commit message
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between gap-x-4">
            <div className="flex grow gap-x-1 truncate w-full">
              {app.status === "initializing" && !timeAgo && (
                <SkeletonLoader className="h-4 w-20" loading />
              )}
              <div className={clsx("text-xs", theme.text4)}>{timeAgo}</div>
              {app.defaultBranch && (
                <div
                  className={clsx(
                    "flex grow text-xs truncate items-center",
                    theme.text2,
                  )}
                >
                  <div className={clsx("text-xs mr-1", theme.text4)}>on</div>
                  <BranchIcon className="w-3 h-3 shrink-0 mr-0.5" />
                  <Link
                    className={clsx(
                      "truncate",
                      "text-xs",
                      theme.text2Hover,
                      "focus:underline hover:underline z-10 outline-none",
                    )}
                    target="_blank"
                    to={branchUrl}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {app.defaultBranch}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
