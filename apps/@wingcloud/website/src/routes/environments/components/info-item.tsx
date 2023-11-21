import clsx from "clsx";
import type { ReactNode } from "react";

import { SkeletonLoader } from "../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";

export const InfoItem = ({
  label,
  value,
  loading,
}: {
  label: string;
  value: ReactNode;
  loading?: boolean;
}) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col gap-1 truncate">
      <div className={clsx("text-xs", theme.text2)}>{label}</div>

      <SkeletonLoader loading={loading}>
        <div
          className={clsx(
            "truncate text-xs font-medium",
            theme.text1,
            "h-5 flex",
          )}
        >
          {value}
        </div>
      </SkeletonLoader>
    </div>
  );
};
