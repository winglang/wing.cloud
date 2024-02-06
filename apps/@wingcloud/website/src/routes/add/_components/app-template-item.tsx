import clsx from "clsx";

import { StatusDot } from "../../../components/status-dot.js";
import { useTheme } from "../../../design-system/theme-provider.js";

export interface AppTemplateItemProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  classname?: string;
}

export const AppTemplateItem = ({
  title,
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
        "justify-center p-4 text-center flex items-center",
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
      <div className="flex flex-col items-center h-full justify-center p-4">
        <div className={clsx(theme.text1, "w-20 h-20 flex items-center")}>
          {icon}
        </div>
        <div className="space-y-1 mt-1">
          <div className={clsx(theme.text1, "truncate text-sm")}>{title}</div>
          <div className={clsx("text-xs", theme.text2)}>{description}</div>
        </div>
      </div>
    </button>
  );
};
