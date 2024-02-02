import clsx from "clsx";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Menu } from "../../../design-system/menu.js";
import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../icons/branch-icon.js";
import { MenuIcon } from "../../../icons/menu-icon.js";
import { TypeScriptIcon } from "../../../icons/typescript-icon.js";
import { WingIcon } from "../../../icons/wing-icon.js";
import { useTimeAgo } from "../../../utils/time.js";
import type { App } from "../../../utils/wrpc.js";

const AppIcon = ({ app }: { app: App }) => {
  const { theme } = useTheme();

  return (
    <div
      className="w-8 h-8"
      title={app.entrypoint.endsWith(".ts") ? "TypeScript" : "Winglang"}
    >
      {app.entrypoint.endsWith(".ts") && (
        <TypeScriptIcon className={clsx("w-full h-full", "text-[#2f74c0]")} />
      )}
      {app.entrypoint.endsWith(".w") && (
        <WingIcon className={clsx("w-full h-full", theme.text1)} />
      )}
    </div>
  );
};

export const AppCardSkeleton = () => {
  const { theme } = useTheme();
  return (
    <div
      className={clsx(
        "w-full h-full rounded-md",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
        "shadow-sm hover:shadow",
        "truncate",
      )}
    >
      <div
        className={clsx(
          "flex items-center gap-x-4 p-4",
          theme.bg4,
          "border-b",
          "theme.borderInput",
        )}
      >
        <SkeletonLoader className="w-8 h-8" loading />
        <SkeletonLoader className="w-2/4 h-4" loading />
        <div className="flex flex-grow justify-end">
          <SkeletonLoader className="w-4 h-4" />
        </div>
      </div>
      <div className="p-4 text-sm leading-6 space-y-2">
        <SkeletonLoader className="w-1/4 h-4" loading />
        <SkeletonLoader className="w-3/4 h-4" loading />
      </div>
    </div>
  );
};

export const AppCard = ({
  app,
  owner,
  onOpenSettings,
  onClick,
}: {
  app: App;
  owner: string;
  onOpenSettings: () => void;
  onClick: () => void;
}) => {
  const { theme } = useTheme();
  const timeAgo = useTimeAgo(app.commit.date || Date.now().toString());
  const navigate = useNavigate();

  const branchUrl = useMemo(() => {
    return `https://github.com/${app.repoOwner}/${app.repoName}/tree/${app.defaultBranch}`;
  }, [app]);

  const commitUrl = useMemo(() => {
    return `https://github.com/${app.repoOwner}/${app.repoName}/commit/${app.commit.sha}`;
  }, [app]);

  return (
    <div
      className={clsx(
        "w-full h-full rounded-md",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
        "shadow-sm hover:shadow",
        "truncate",
      )}
    >
      <div
        className={clsx(
          "flex items-center gap-x-4 p-4",
          theme.bg4,
          "border-b",
          "theme.borderInput",
        )}
      >
        <AppIcon app={app} />
        <Link
          className={clsx(
            "text-sm font-medium leading-6",
            theme.text1,
            theme.text1Hover,
            "hover:underline",
          )}
          onClick={onClick}
          to={`/${owner}/${app.appName}`}
        >
          {app.appName}
        </Link>
        <div className="flex flex-grow justify-end">
          <Menu
            icon={<MenuIcon className={clsx("w-4 h-4", theme.text2)} />}
            btnClassName=" flex"
            items={[
              {
                label: "Settings",
                onClick: onOpenSettings,
              },
            ]}
          />
        </div>
      </div>
      <div className="p-4 text-sm leading-6 space-y-2">
        <div className="flex justify-between gap-x-4">
          <div className="flex gap-x-2 truncate">
            <div className={clsx("text-xs", theme.text2)}>{timeAgo} on</div>
            <div className={clsx("flex text-xs truncate", theme.text1)}>
              <BranchIcon className={clsx("w-4 h-4", theme.text1)} />
              <Link
                className={clsx(
                  "truncate",
                  "text-xs",
                  theme.text1,
                  theme.text1Hover,
                  "hover:underline",
                )}
                target="_blank"
                to={branchUrl}
              >
                {app.defaultBranch}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-x-4">
          <div className="flex gap-x-2 truncate">
            <Link
              className={clsx(
                "truncate",
                "text-xs",
                theme.text1,
                theme.text1Hover,
                "hover:underline",
              )}
              target="_blank"
              to={commitUrl}
            >
              {app.commit.message}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
