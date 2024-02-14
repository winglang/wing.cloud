import clsx from "clsx";

import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";

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
          "flex items-center gap-x-4 p-4 rounded-t-md",
          theme.bg4,
          theme.borderInput,
          "border-b",
        )}
      >
        <SkeletonLoader className="w-8 h-8" loading />
        <SkeletonLoader className="w-2/4 h-4" loading />
        <div className="flex flex-grow justify-end">
          <SkeletonLoader className="w-4 h-4" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <SkeletonLoader className="w-3/5 h-4 pb-2" loading />
        <div className="space-y-2">
          <SkeletonLoader className="w-2/3 h-4" loading />
          <SkeletonLoader className="w-1/3 h-4" loading />
        </div>
      </div>
    </div>
  );
};
