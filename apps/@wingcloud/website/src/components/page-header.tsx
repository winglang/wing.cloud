import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";

export interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  actions?: React.ReactNode;
  noBackground?: boolean;
}

export const PageHeader = ({
  title,
  description,
  actions,
  noBackground = false,
}: PageHeaderProps) => {
  const { theme } = useTheme();
  return (
    <div
      className={clsx(!noBackground && ["border-b", theme.bg4, theme.border4])}
    >
      <div className="w-full max-w-7xl overflow-auto mx-auto p-4 md:px-8 flex">
        <div className="space-y-1 flex-grow truncate items-center">
          <div className={clsx("text-2xl font-semibold h-8", theme.text1)}>
            {title}
          </div>
          {description && (
            <div className={clsx("text-sm w-full truncate h-5", theme.text3)}>
              {description}
            </div>
          )}
        </div>
        <div className="flex justify-end items-end gap-x-2">{actions}</div>
      </div>
    </div>
  );
};
