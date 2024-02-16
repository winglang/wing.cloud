import clsx from "clsx";

import { useTheme } from "../../../design-system/theme-provider.js";
import { TypeScriptIcon } from "../../../icons/typescript-icon.js";
import { WingIcon } from "../../../icons/wing-icon.js";

export const AppIcon = ({
  appName,
  entrypoint,
  classNames,
}: {
  appName: string;
  entrypoint?: string;
  classNames?: string;
}) => {
  const { theme } = useTheme();

  if (entrypoint?.endsWith(".ts")) {
    return (
      <TypeScriptIcon
        className={clsx("text-[#2f74c0] shrink-0", classNames)}
        title={entrypoint.endsWith(".ts") ? "TypeScript" : "Winglang"}
      />
    );
  }
  if (entrypoint?.endsWith(".w")) {
    return (
      <WingIcon
        className={clsx("text-[#8bc6bc] shrink-0", classNames)}
        title={entrypoint.endsWith(".ts") ? "TypeScript" : "Winglang"}
      />
    );
  }

  // return an icon for the app with the default icon being the first letter of the app name
  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded shrink-0",
        classNames,
        theme.bg2,
      )}
    >
      {appName.charAt(0).toUpperCase()}
    </div>
  );
};
