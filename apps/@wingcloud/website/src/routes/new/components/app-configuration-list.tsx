import { LinkIcon, SquaresPlusIcon } from "@heroicons/react/24/outline";
import { useCallback } from "react";

import { AppConfigurationListItem } from "./app-configuration-list-item.js";
import type { ConfigurationType } from "./app-configuration.js";

export interface AppConfigurationListProps {
  onSetType: (configType: ConfigurationType) => void;
  type?: ConfigurationType;
  disabled?: boolean;
}

export const AppConfigurationList = ({
  onSetType,
  type,
  disabled,
}: AppConfigurationListProps) => {
  const toggleConfigType = useCallback(
    (value: ConfigurationType) => {
      if (disabled) {
        return;
      }
      onSetType(value);
    },
    [type, onSetType, disabled],
  );

  return (
    <>
      <AppConfigurationListItem
        name="Connect"
        description="Connect to an existing repository"
        icon={<LinkIcon className="w-5 h-5" />}
        checked={type === "connect"}
        disabled={disabled}
        onChange={() => {
          toggleConfigType("connect");
        }}
      />
      <AppConfigurationListItem
        name=""
        description="More coming soon!"
        icon={<SquaresPlusIcon className="w-5 h-5" />}
        checked={false}
        disabled={true}
        classname="opacity-50 cursor-default"
      />
    </>
  );
};
