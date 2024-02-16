import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";

import { Tabs, type Tab } from "./tabs.js";

export interface PageHeaderProps {
  title?: string;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  noBackground?: boolean;
  tabs?: Tab[];
}

export const PageHeader = ({
  title,
  description,
  icon,
  actions,
  noBackground = false,
  tabs,
}: PageHeaderProps) => {
  const { theme } = useTheme();
  return (
    <div
      className={clsx(!noBackground && ["border-b", theme.bg4, theme.border4])}
    >
      <div
        className={clsx(
          "overflow-auto pt-4 sm:pt-8 flex",
          !tabs && "pb-4",
          "transition-all",
          theme.pageMaxWidth,
          theme.pagePadding,
        )}
      >
        <div className="space-y-1 flex-grow items-center">
          <div className="flex gap-x-2 items-center">
            {icon && <div className={clsx("size-6", theme.text1)}>{icon}</div>}
            {title && (
              <div
                className={clsx(
                  "text-2xl font-semibold truncate h-8",
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
          {tabs && (
            <div className="pt-3">
              <Tabs tabs={tabs} />
            </div>
          )}
        </div>
        <div
          className={clsx(
            "flex justify-end items-end gap-x-2",
            tabs && "pb-4 md:pb-8",
          )}
        >
          {actions || <span className="pt-2.5">&nbsp;</span>}
        </div>
      </div>
    </div>
  );
};
