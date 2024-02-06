import clsx from "clsx";

import { useTheme } from "../../../design-system/theme-provider.js";
import { TypeScriptIcon } from "../../../icons/typescript-icon.js";
import { WingIcon } from "../../../icons/wing-icon.js";
import type { App } from "../../../utils/wrpc.js";

export const AppIcon = ({ app }: { app: App }) => {
  const { theme } = useTheme();

  if (app.entrypoint.endsWith(".ts")) {
    return (
      <TypeScriptIcon
        className="w-8 h-8 text-[#2f74c0]"
        title={app.entrypoint.endsWith(".ts") ? "TypeScript" : "Winglang"}
      />
    );
  }
  if (app.entrypoint.endsWith(".w")) {
    return (
      <WingIcon
        className="w-8 h-8 text-[#8bc6bc]"
        title={app.entrypoint.endsWith(".ts") ? "TypeScript" : "Winglang"}
      />
    );
  }
  // return an icon for the app with the default icon being the first letter of the app name
  return (
    <div
      className={clsx(
        "w-8 h-8 flex items-center justify-center rounded",
        theme.bg2,
      )}
    >
      {app.appName.charAt(0).toUpperCase()}
    </div>
  );
};
