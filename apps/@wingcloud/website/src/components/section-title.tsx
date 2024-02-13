import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { useTheme } from "../design-system/theme-provider.js";

export const SectionTitle = ({ children }: PropsWithChildren) => {
  const { theme } = useTheme();
  return (
    <div className={clsx("text-lg font-semibold", theme.text2)}>{children}</div>
  );
};
