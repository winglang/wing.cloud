import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";

export interface PageHeaderProps {
  title?: string;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  noBackground?: boolean;
}

export const PageHeader = ({
  title,
  description,
  icon,
  actions,
  noBackground = false,
}: PageHeaderProps) => {
  const { theme } = useTheme();
  return (
    <div
      className={clsx(!noBackground && ["border-b", theme.bg4, theme.border4])}
    >
      <div
        className={clsx(
          "overflow-auto py-4 sm:py-6 flex",
          "transition-all",
          theme.pageMaxWidth,
          theme.pagePadding,
          "gap-2",
        )}
      >
        <div className="space-y-1 flex-grow items-center truncate">
          <div className="flex gap-x-2 sm:gap-x-3 items-center truncate">
            {icon && (
              <div
                className={clsx(
                  "size-7 p-1 rounded shrink-0",
                  theme.text3,
                  theme.bg2,
                )}
              >
                {icon}
              </div>
            )}
            {title && (
              <div
                className={clsx(
                  "text-2xl font-semibold truncate",
                  "leading-7 py-[1px]",
                  theme.text1,
                )}
              >
                {title}
              </div>
            )}
          </div>
          {description && (
            <div className={clsx("text-sm w-full truncate h-5", theme.text3)}>
              {description}
            </div>
          )}
        </div>
        <div className="flex justify-end items-end gap-x-1 sm:gap-x-2">
          {actions}
        </div>
      </div>
    </div>
  );
};
