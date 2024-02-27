import { Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { Button } from "../../../../../design-system/button.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";

export const PendingChangesWarning = ({
  show,
  onRestart,
  onClose,
  loading,
}: {
  show: boolean;
  onRestart: () => void;
  onClose: () => void;
  loading?: boolean;
}) => {
  const { theme } = useTheme();

  return (
    <Transition
      show={show}
      enter="transition-opacity duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={clsx(
          "rounded-md p-4 border",
          "space-y-2",
          "bg-yellow-50 border-yellow-200 text-yellow-800",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex grow items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-bold">Changes not deployed</span>
          </div>
          <button
            className={clsx(
              theme.text1,
              theme.text1Hover,
              theme.focusVisible,
              "transition-all",
              "rounded p-0.5 -mt-4 -mr-2",
            )}
            onClick={onClose}
          >
            <XMarkIcon className="size-4" />
          </button>
        </div>
        <div className="flex items-center">
          <div className="text-xs grow">
            A redeploy is required for changes to take effect.
          </div>
          <div className="flex flex-col justify-between gap-2">
            <Button onClick={onRestart} disabled={loading}>
              {loading ? "Deploying..." : "Redeploy all enviroments"}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  );
};
