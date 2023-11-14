import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { type PropsWithChildren } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../../../design-system/theme-provider.js";

export interface NewAppContainerProps {
  step?: string;
}

export const NewAppContainer = ({
  step,
  children,
}: PropsWithChildren<NewAppContainerProps>) => {
  const { theme } = useTheme();

  return (
    <div className="flex justify-center transition-all">
      <div
        className={clsx("w-full rounded shadow p-6 space-y-4", theme.bgInput)}
      >
        <div className="flex items-center gap-1 font-semibold">
          <Link to="/apps/new">Create a new App</Link>
          {step && (
            <>
              <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
              <div className="truncate">{step}</div>
            </>
          )}
        </div>

        <div className="mb-4 flex flex-col w-full text-sm">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};
