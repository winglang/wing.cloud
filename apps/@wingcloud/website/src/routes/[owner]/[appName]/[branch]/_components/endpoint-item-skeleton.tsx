import clsx from "clsx";

import { SkeletonLoader } from "../../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";

export const EndpointItemSkeleton = () => {
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
          <SkeletonLoader className="w-5 h-5" loading />
        </div>

        <div className="w-full space-y-2 py-0.5">
          <SkeletonLoader className="h-4 w-1/5" loading />
          <SkeletonLoader className="h-4 w-3/5" loading />
        </div>
      </div>
    </div>
  );
};
