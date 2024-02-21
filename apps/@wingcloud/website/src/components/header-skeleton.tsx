import clsx from "clsx";

import { SkeletonLoader } from "../design-system/skeleton-loader.js";
import { useTheme } from "../design-system/theme-provider.js";
import { WingIcon } from "../icons/wing-icon.js";

export const HeaderSkeleton = () => {
  const { theme } = useTheme();

  return (
    <header
      className={clsx(
        "py-4 shadow flex flex-row",
        theme.bgInput,
        theme.pagePadding,
      )}
    >
      <div className="flex items-center gap-6">
        <WingIcon className={clsx("h-5 w-auto", theme.text1)} />
        <div className="flex items-center gap-1 sm:gap-2">
          <div>
            <SkeletonLoader
              className="w-32 h-5 bg-slate-300 animate-pulse rounded px-2 py-1"
              loading
            />
          </div>
        </div>
      </div>
      <div className="flex-grow"></div>
      <div className={"h-7 w-7 animate-pulse rounded-full bg-slate-300"} />
    </header>
  );
};
