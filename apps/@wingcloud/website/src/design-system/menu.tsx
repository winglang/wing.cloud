import { Menu as HeadlessMenu, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, type MouseEvent, type PropsWithChildren } from "react";

import { useTheme } from "./theme-provider.js";

interface Item {
  label?: string;
  onClick?: (event: MouseEvent) => void;
  disabled?: boolean;
}

export interface MenuProps {
  title?: string;
  icon?: React.ReactNode;
  items: Item[];
  btnClassName?: string;
  onClick?: (event: MouseEvent) => void;
}

export const Menu = ({
  title,
  icon,
  items = [],
  btnClassName,
  onClick,
  children,
}: PropsWithChildren<MenuProps>) => {
  const { theme } = useTheme();
  return (
    <div className="relative items-center flex">
      <HeadlessMenu as="div" className="relative inline-block text-left">
        <div>
          <HeadlessMenu.Button
            className={clsx(
              btnClassName,
              theme.text1,
              theme.focusVisible,
              theme.bgInputHover,
              "flex items-center text-sm gap-x-2",
              "font-semibold",
            )}
            onClick={(event) => {
              onClick?.(event);
            }}
          >
            {title && <div className="pl-2">{title}</div>}
            {icon}
          </HeadlessMenu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <HeadlessMenu.Items
            className={clsx(
              "absolute right-0 mt-2 w-56 origin-top-right",
              "rounded-md shadow-lg z-20 border",
              "divide-y divide-slate-100 dark:divide-slate-700",
              theme.bgInput,
              theme.borderInput,
              theme.focusVisible,
            )}
          >
            {children}
            <div className="p-1">
              {items.map((item) => (
                <HeadlessMenu.Item key={item.label}>
                  {({ active }) => (
                    <button
                      disabled={item.disabled}
                      key={item.label}
                      onClick={item.onClick}
                      className={clsx(
                        active && theme.bg3,
                        "group flex w-full items-center rounded px-2 py-2 text-sm",
                        theme.textInput,
                      )}
                    >
                      {item.label}
                    </button>
                  )}
                </HeadlessMenu.Item>
              ))}
            </div>
          </HeadlessMenu.Items>
        </Transition>
      </HeadlessMenu>
    </div>
  );
};
