import { Popover as HeadlessPopover, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { Fragment, type PropsWithChildren } from "react";

import { useTheme } from "./theme-provider.js";

export interface PopoverProps {
  button: React.ReactNode;
}

export default function Popover({
  button,
  children,
}: PropsWithChildren<PopoverProps>) {
  const { theme } = useTheme();

  return (
    <div className="">
      <HeadlessPopover className="relative">
        {({ open }) => (
          <>
            <HeadlessPopover.Button>{button}</HeadlessPopover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <HeadlessPopover.Panel
                className={clsx(
                  "absolute z-10 mt-3 transform px-4 right-0",
                  theme.bgInput,
                  "border shadow-lg p-4 rounded-md",
                  theme.borderInput,
                )}
              >
                {children}
              </HeadlessPopover.Panel>
            </Transition>
          </>
        )}
      </HeadlessPopover>
    </div>
  );
}
