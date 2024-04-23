import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

import { Button } from "./button.js";

export interface BannerProps {
  type?: "info" | "warning" | "error";
  visible?: boolean;
  onClose?: () => void;
}

export const Banner = ({
  children,
  type = "info",
  visible = true,
  onClose,
}: PropsWithChildren<BannerProps>) => {
  return (
    <div
      className={clsx(
        "fixed w-full flex justify-center p-4 transition-all duration-500",
        type === "info" && "bg-blue-100",
        type === "warning" && "bg-yellow-100",
        type === "error" && "bg-red-100",
        visible && "opacity-100 top-0",
        !visible && "opacity-0 pointer-events-none -top-full",
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {type === "info" && (
            <InformationCircleIcon className="size-5 text-blue-700" />
          )}
          {type === "warning" && (
            <InformationCircleIcon className="size-5 text-yellow-700" />
          )}
          {type === "error" && (
            <InformationCircleIcon className="size-5 text-red-700" />
          )}
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p
            className={clsx(
              "text-sm",
              type === "info" && "text-blue-700",
              type === "warning" && "text-yellow-700",
              type === "error" && "text-red-700",
            )}
          >
            {children}
          </p>
        </div>
      </div>
      <div className="absolute right-5 justify-center">
        {onClose && (
          <button
            className="rounded-md p-0.5 hover:bg-gray-100"
            onClick={onClose}
          >
            <XMarkIcon className="size-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};
