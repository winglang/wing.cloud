import { ArrowPathIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { useTheme } from "../../../../design-system/theme-provider.js";

export const RestartButton = ({
  onClick,
  small = false,
}: {
  onClick: () => void;
  small?: boolean;
}) => {
  const { theme } = useTheme();

  return (
    <button onClick={onClick} className="z-10">
      <ArrowPathIcon
        className={clsx(
          "transition-all",
          "rounded-sm",
          small && "size-3.5",
          !small && "size-6 p-1",
          theme.text3,
          theme.text3Hover,
        )}
      />
    </button>
  );
};
