import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { useTheme } from "../design-system/theme-provider.js";

export const SectionContent = ({
  classNames,
  children,
}: PropsWithChildren<{
  classNames?: string;
}>) => {
  const { theme } = useTheme();
  return (
    <div
      className={clsx(
        "flex flex-col gap-x-2 rounded-md p-4 border",
        theme.bgInput,
        theme.borderInput,
        "space-y-2 relative",
        classNames,
      )}
    >
      {children}
    </div>
  );
};
