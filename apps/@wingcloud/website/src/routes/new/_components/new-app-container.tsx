import { ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { type ForwardRefExoticComponent, type PropsWithChildren } from "react";
import { Link, useParams } from "react-router-dom";

import { Header } from "../../../components/header.js";
import { useTheme } from "../../../design-system/theme-provider.js";

export interface NewAppContainerProps {
  step?: {
    name: string;
    icon: ForwardRefExoticComponent<any>;
  };
}

export const NewAppContainer = ({
  step,
  children,
}: PropsWithChildren<NewAppContainerProps>) => {
  const { owner } = useParams();
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div
        className={clsx(
          "w-full flex-grow overflow-auto",
          "max-w-5xl mx-auto p-4 sm:p-6",
          "space-y-4",
        )}
      >
        <div
          className={clsx(
            "w-full rounded p-6 space-y-4 border",
            theme.bg4,
            theme.borderInput,
          )}
        >
          <div className={clsx("flex items-center gap-1", theme.text1)}>
            <Link to={`/${owner}/new`} className={clsx("font-semibold")}>
              Create a new App
            </Link>
            {step && (
              <>
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0" />
                <step.icon className="h-3.5 w-3.5 font-semibold" />
                <div className="truncate">{step.name}</div>
              </>
            )}
          </div>

          <div className="mb-4 flex flex-col w-full text-sm">
            <div className="w-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
