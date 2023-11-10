import { LinkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback } from "react";

import { Checkbox } from "../design-system/checkbox.js";
import { useTheme } from "../design-system/theme-provider.js";

export type ConfigurationType = "connect";
export interface NewAppTypeSelectProps {
  onSetType: (configType?: ConfigurationType) => void;
  type?: ConfigurationType;
  disabled?: boolean;
}

export const AppConfigTypeList = ({
  onSetType,
  type,
  disabled,
}: NewAppTypeSelectProps) => {
  const { theme } = useTheme();

  const toggleConfigType = useCallback(
    (value: ConfigurationType) => {
      if (disabled) {
        return;
      }
      if (type === value) {
        // eslint-disable-next-line unicorn/no-useless-undefined
        onSetType(undefined);
        return;
      }
      onSetType(value);
    },
    [type, onSetType, disabled],
  );

  return (
    <button
      aria-disabled={disabled}
      className={clsx(
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
          type === "connect" && [
            "ring-2 ring-sky-500/50 border-sky-500 outline-none",
          ],
        ],
      )}
      onClick={() => {
        toggleConfigType("connect");
      }}
    >
      <div className="flex gap-x-4 items-center">
        <LinkIcon className="w-5 h-5" />
        <div className="">
          <div className={clsx(theme.text1)}>Connect</div>
          <div className={clsx("text-xs", theme.text2)}>
            Connect to an existing repository
          </div>
        </div>
      </div>

      <div className="flex grow justify-end text-slate-500 items-center">
        <Checkbox
          checked={type === "connect"}
          disabled={disabled}
          onChange={() => {
            toggleConfigType("connect");
          }}
          className="cursor-pointer"
        />
      </div>
    </button>
  );
};
