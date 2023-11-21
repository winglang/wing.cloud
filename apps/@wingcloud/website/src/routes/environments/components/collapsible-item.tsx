import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState, type PropsWithChildren, type ReactNode } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { useTheme } from "../../../design-system/theme-provider.js";

export const CollapsibleItem = ({
  id,
  title,
  disabled,
  loading = false,
  defaultOpen = false,
  rightOptions,
  children,
}: PropsWithChildren<{
  id?: string;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  defaultOpen?: boolean;
  rightOptions?: ReactNode;
}>) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={clsx(
        "w-full rounded border",
        theme.bgInput,
        theme.borderInput,
      )}
    >
      <button
        id={id}
        className={clsx(
          "flex items-center justify-between w-full text-left p-6",
          isOpen && "border-b rounded-t shadow-sm",
          !isOpen && "rounded",
          theme.borderInput,
          theme.textInput,
          disabled && "cursor-not-allowed opacity-50",
        )}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center flex-grow gap-2">
          {isOpen && <ChevronDownIcon className="h-4 w-4" />}
          {!isOpen && <ChevronRightIcon className="h-4 w-4" />}
          <div className="font-medium text-sm">{title}</div>
        </div>

        <div className="flex justify-end gap-4">{rightOptions}</div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-4">
          {loading && (
            <div className="flex items-center justify-center">
              <SpinnerLoader size="sm" />
            </div>
          )}
          {!loading && children}
        </div>
      )}
    </div>
  );
};
