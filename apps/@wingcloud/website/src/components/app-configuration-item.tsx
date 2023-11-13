import clsx from "clsx";

import { useTheme } from "../design-system/theme-provider.js";

export interface AppConfigurationItemProps {
  name: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  checked?: boolean;
  onChange?: () => void;
  classname?: string;
}

export const AppConfigurationItem = ({
  name,
  description,
  icon,
  disabled,
  checked,
  onChange,
  classname,
}: AppConfigurationItemProps) => {
  const { theme } = useTheme();

  return (
    <button
      aria-disabled={disabled}
      className={clsx(
        classname,
        "w-full p-4 text-left flex items-center",
        "rounded-md shadow-sm",
        "transition-all hover:shadow",
        "border",
        theme.text1,
        theme.bgInput,
        theme.borderInput,
        "gap-1",
        !disabled && [
          theme.focusInput,
          checked && ["ring-2 ring-sky-500/50 border-sky-500 outline-none"],
        ],
      )}
      onClick={onChange}
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

      <div className="flex grow justify-end text-slate-500 items-center">
        {onChange && (
          <div
            className={clsx(
              "w-3 h-3 rounded-full",
              "border-2",
              theme.borderInput,
              checked && "bg-sky-400",
            )}
          />
        )}
      </div>
    </button>
  );
};
