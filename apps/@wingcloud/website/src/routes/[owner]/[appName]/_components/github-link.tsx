import clsx from "clsx";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../../../../design-system/theme-provider.js";
import { GithubIcon } from "../../../../icons/github-icon.js";
import type { App } from "../../../../utils/wrpc.js";

export const GitHubLink = ({ app }: { app: App }) => {
  const { theme } = useTheme();

  const projectUrl = useMemo(() => {
    return `https://github.com/${app.repoOwner}/${app.repoName}`;
  }, [app]);

  return (
    <Link
      className={clsx(
        "truncate",
        "text-xs font-medium outline-none",
        "flex gap-x-2 truncate items-center z-10 group",
        theme.text2,
        theme.text2Hover,
      )}
      onClick={(event) => event.stopPropagation()}
      target="_blank"
      to={projectUrl}
    >
      <GithubIcon className="w-4 h-4 shrink-0" />
      <div className="truncate group-hover:underline group-focus:underline">
        {app.repoOwner}/{app.repoName}
      </div>
    </Link>
  );
};
