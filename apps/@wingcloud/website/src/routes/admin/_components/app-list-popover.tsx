import clsx from "clsx";
import { Link } from "react-router-dom";

import Popover from "../../../design-system/popover.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import type { App, User } from "../../../utils/wrpc.js";

export const AppListPopover = ({ user, apps }: { user: User; apps: App[] }) => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center gap-x-1">
      {apps.length > 0 && (
        <Popover
          classNames={clsx(
            "z-10",
            "rounded-full py-0.5 px-1.5 flex text-xs font-semibold",
            theme.textInput,
            "border",
            theme.borderInput,
            theme.focusVisible,
            theme.bg2,
            theme.bg2Hover,
            "transition-all",
          )}
          button={`${apps.length} app${apps.length > 1 ? "s" : ""}`}
        >
          <div className="flex gap-x-3">
            <div className="space-y-1">
              {apps.map((app) => (
                <div key={app.appId} className="flex gap-2 items-center">
                  <Link
                    className={clsx(
                      "hover:underline focus:underline outline-none",
                      "truncate relative z-10 flex gap-x-1",
                      theme.text1,
                      "text-xs",
                    )}
                    to={`/${user.username}/${app.appName}`}
                    rel="noopener noreferrer"
                  >
                    {app.appName}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Popover>
      )}
      {apps?.length === 0 && (
        <div className="px-1.5 text-gray-400">No apps</div>
      )}
    </div>
  );
};
