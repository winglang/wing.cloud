import clsx from "clsx";

import { useTheme } from "../../../design-system/theme-provider.js";
import type { App } from "../../../utils/wrpc.js";

export const AppCard = ({
  app,
  onClick,
}: {
  app: App;
  onClick: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col",
        "w-full h-full p-4 rounded-lg",
        "text-left border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <div className="space-y-4 w-full">
        <div className="flex gap-x-2">
          {app.imageUrl && (
            <img src={app.imageUrl} className="w-10 h-10 rounded-full" />
          )}
          {!app.imageUrl && (
            <div className="w-10 h-10 rounded-full bg-sky-50 flex justify-center items-center">
              <div className={clsx(theme.text1)}>{app.appName[0]}</div>
            </div>
          )}
        </div>

        <div className="w-full truncate space-y-1">
          <div className="text-lg text-slate-800">{app.appName}</div>
        </div>
      </div>
    </button>
  );
};
