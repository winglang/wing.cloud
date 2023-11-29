import clsx from "clsx";

import { StatusDot } from "../../../components/status-dot.js";
import { useTheme } from "../../../design-system/theme-provider.js";

export interface AppConfigurationListItemProps {
  name: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  classname?: string;
}

export const AppConfigurationListItem = ({
  name,
  description,
  icon,
  disabled,
  onClick,
  classname,
}: AppConfigurationListItemProps) => {
  const { theme } = useTheme();

  return (
    <button
      aria-disabled={disabled}
      className={clsx(
        classname,
        "w-full p-4 text-left flex items-center",
        "border rounded transition-all",
        theme.text1,
        theme.bgInputHover,
        !disabled && theme.focusInput,
        theme.bgInput,
        theme.borderInput,
      )}
      onClick={onClick}
    >
      <div className="flex gap-x-4 items-center h-full">
        <div className={clsx(theme.text1)}>{icon}</div>
        <div>
          <div className={clsx(theme.text1)}>{name}</div>
          <div className={clsx("text-xs items-end", theme.text2)}>
            {description}
          </div>
        </div>
      </div>
    </button>
  );
};
