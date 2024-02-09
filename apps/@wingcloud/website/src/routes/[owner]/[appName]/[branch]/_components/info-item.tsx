import clsx from "clsx";
import type { ReactNode } from "react";

import { SkeletonLoader } from "../../../../../design-system/skeleton-loader.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";

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
    <div className="flex flex-col gap-1">
      <div className={clsx("text-xs truncate", theme.text2)}>{label}</div>

      <SkeletonLoader loading={loading}>
        <div className="min-h-[20px] text-sm">{value}</div>
      </SkeletonLoader>
    </div>
  );
};
