import { Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { useTheme } from "../../../../../design-system/theme-provider.js";

export const DirtyEnvironmentsWarning = ({
  show,
  onClose,
}: {
  show: boolean;
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
            <span className="font-bold">Redeploy required</span>
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
            Changes will not be applied until the environment is redeployed.
          </div>
        </div>
      </div>
    </Transition>
  );
};
