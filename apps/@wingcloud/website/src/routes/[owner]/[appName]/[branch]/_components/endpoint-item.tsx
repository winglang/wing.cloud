import { GlobeAltIcon, BoltIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useCallback } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../../../design-system/button.js";
import { useNotifications } from "../../../../../design-system/notification.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import { useTimeAgo } from "../../../../../utils/time.js";
import type { Endpoint } from "../../../../../utils/wrpc.js";

export const EndpointItem = ({ endpoint }: { endpoint: Endpoint }) => {
  const { theme } = useTheme();
  const updatedAt = useTimeAgo(endpoint.updatedAt);
  const { showNotification } = useNotifications();

  const copyEndpointLink = useCallback(() => {
    navigator.clipboard.writeText(endpoint.publicUrl);
    showNotification("Copied to clipboard");
  }, [endpoint.publicUrl, showNotification]);

  return (
    <div
      className={clsx(
        "rounded-md p-4 text-left w-full block",
        theme.bgInput,
        "border",
        theme.borderInput,
        theme.focusVisible,
        "shadow-sm hover:shadow",
        "relative group",
      )}
    >
      <div className="flex items-center gap-x-4">
        {endpoint.browserSupport && (
          <GlobeAltIcon
            className="size-4 text-violet-700 dark:text-violet-400 shrink-0"
            title="Website"
          />
        )}
        {!endpoint.browserSupport && (
          <BoltIcon
            className="size-4 text-amber-500 dark:text-amber-400 shrink-0"
            title="Function"
          />
        )}

        <div className="flex justify-between items-center truncate grow">
          <div className="text-xs space-y-1 truncate w-full">
            <div
              className={clsx(
                "font-medium truncate",
                theme.text1,
                theme.text1Hover,
              )}
            >
              {endpoint.label}
            </div>

            <div
              className={clsx(
                "flex gap-x-2 items-center w-full",
                "sm:gap-x-5 truncate",
                "leading-5 py-0.5",
                theme.text2,
              )}
            >
              <div className="flex gap-x-1.5 w-full items-center">
                <Link
                  to={endpoint.publicUrl}
                  target="_blank"
                  className={clsx(
                    "z-10",
                    theme.textFocus,
                    "group flex items-center truncate",
                    "outline-none hover:underline focus-visible:underline",
                    "gap-x-1",
                    "font-semibold",
                  )}
                >
                  <div className="truncate">{endpoint.publicUrl}</div>
                </Link>
                <div
                  className={clsx(
                    "truncate items-center opacity-70",
                    "transition-all text-xs",
                    theme.text3,
                  )}
                >
                  updated {updatedAt}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-x-4 px-2">
          <Button
            small
            className={clsx(
              "z-10",
              theme.text3,
              theme.text3Hover,
              theme.focusVisible,
              "rounded p-1",
              "flex items-center truncate",
              "outline-none focus-visible:underline",
              "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all",
            )}
            onClick={copyEndpointLink}
          >
            Copy URL
          </Button>
        </div>
      </div>
    </div>
  );
};
