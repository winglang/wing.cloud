import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { useTheme } from "../design-system/theme-provider.js";

export const SectionSubtitle = ({ children }: PropsWithChildren) => {
  const { theme } = useTheme();
  return (
    <div className={clsx("text-sm font-semibold", theme.text1)}>{children}</div>
  );
};
