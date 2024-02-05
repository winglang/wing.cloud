import clsx from "clsx";

import { StatusDot } from "../../../components/status-dot.js";
import { useTheme } from "../../../design-system/theme-provider.js";

export interface AppTemplateItemProps {
  name: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  classname?: string;
}

export const AppTemplateItem = ({
  name,
  description,
  icon,
  disabled,
  onClick,
  classname,
}: AppTemplateItemProps) => {
  const { theme } = useTheme();

  return (
    <button
      aria-disabled={disabled}
      className={clsx(
        classname,
        "w-full p-4 text-left flex items-center",
        "border rounded transition-all",
        "shadow-sm",
        theme.text1,
        theme.bgInputHover,
        !disabled && theme.focusInput,
        theme.bgInput,
        theme.borderInput,
      )}
      onClick={onClick}
    >
      <div className="flex gap-x-4 items-center h-full truncate">
        <div className={clsx(theme.text1)}>{icon}</div>
        <div className="truncate">
          <div className={clsx(theme.text1, "truncate")}>{name}</div>
          <div className={clsx("text-xs items-end truncate", theme.text2)}>
            {description}
          </div>
        </div>
      </div>
    </button>
  );
};
