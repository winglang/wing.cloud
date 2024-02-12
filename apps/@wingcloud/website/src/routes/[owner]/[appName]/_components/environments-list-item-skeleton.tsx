import clsx from "clsx";

import { StatusDot } from "../../../../components/status-dot.js";
import { SkeletonLoader } from "../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../design-system/theme-provider.js";
import { BranchIcon } from "../../../../icons/branch-icon.js";

export const EnvironmentsListItemSkeleton = ({
  short = false,
}: {
  short?: boolean;
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={clsx(
        "rounded-md p-4 text-left w-full block",
        theme.bgInput,
        "border",
        theme.borderInput,
        "shadow-sm hover:shadow",
      )}
    >
      <div className="flex items-center gap-x-4">
        <div className="relative">
          <BranchIcon
            className={clsx(
              "w-8 h-8 ",
              "rounded-full border-slate-300 border",
              theme.text2,
            )}
          />
          <StatusDot status="initializing" />
        </div>

        <div className="w-full space-y-2 py-0.5">
          <SkeletonLoader
            className={clsx("h-4", short ? "w-1/6" : "w-1/5")}
            loading
          />
          <SkeletonLoader
            className={clsx("h-4", short ? "w-1/3" : "w-2/5")}
            loading
          />
        </div>
      </div>
    </div>
  );
};
