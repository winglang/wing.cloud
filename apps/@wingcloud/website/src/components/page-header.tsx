import clsx from "clsx";

import { SkeletonLoader } from "../design-system/skeleton-loader.js";
import { useTheme } from "../design-system/theme-provider.js";

export interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  actions,
}: PageHeaderProps) => {
  const { theme } = useTheme();
  return (
    <div className={clsx("border-b", theme.border4, theme.bg4)}>
      <div className="w-full max-w-7xl overflow-auto mx-auto p-4 md:p-8 flex">
        <div className="space-y-1 flex-grow truncate">
          <div className={clsx("text-2xl font-semibold", theme.text1)}>
            {title}
          </div>
          <div className={clsx("text-sm w-full truncate h-5", theme.text3)}>
            {description}
          </div>
        </div>
        <div className="flex justify-end items-end gap-x-2">{actions}</div>
      </div>
    </div>
  );
};
