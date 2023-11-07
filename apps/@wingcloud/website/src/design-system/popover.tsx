import { Popover as HeadlessPopover } from "@headlessui/react";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

interface Item {
  label?: string;
  onClick: () => void;
}

export interface PopoverProps {
  title?: string;
  icon?: React.ReactNode;
  items: Item[];
  btnClassName?: string;
}

export const Popover = ({
  title,
  icon,
  items = [],
  btnClassName,
}: PopoverProps) => {
  return (
    <HeadlessPopover className="relative">
      <HeadlessPopover.Button
        className={clsx(
          btnClassName,
          "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
        )}
      >
        {icon}
        {title && <span className="ml-2">{title}</span>}
      </HeadlessPopover.Button>

      <HeadlessPopover.Panel className={clsx("absolute z-10")}>
        <div
          className={clsx(
            "absolute right-0 z-10 mt-2 w-56 origin-top-right",
            "rounded bg-white shadow-lg",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              className={clsx(
                "text-gray-700 block w-full px-4 py-2 text-left text-sm",
                "hover:bg-gray-100 hover:text-gray-900",
                "rounded w-full",
                "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
              )}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
        </div>
      </HeadlessPopover.Panel>
    </HeadlessPopover>
  );
};
