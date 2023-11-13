import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";

export interface StatusDotProps {
  selected: boolean;
}

export const StatusDot = ({ selected }: StatusDotProps) => {
  const { theme } = useTheme();
  return (
    <div
      className={clsx(
        "w-3 h-3 rounded-full",
        "border-2",
        theme.borderInput,
        theme.bgInput,
        theme.bgInputHover,
        selected && [
          "ring-1 ring-sky-500/50 border-sky-500 outline-none",
          "bg-sky-500",
        ],
      )}
    />
  );
};
