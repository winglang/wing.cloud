import { Menu as HeadlessMenu, Transition } from "@headlessui/react";
import clsx from "clsx";
import {
  Fragment,
  useEffect,
  useState,
  type MouseEvent,
  type PropsWithChildren,
} from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";

import { useTheme } from "./theme-provider.js";

interface Item {
  icon?: React.ReactNode;
  label?: string;
  onClick?: (event: MouseEvent) => void;
  disabled?: boolean;
  type?: "button" | "separator";
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

  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    // eslint-disable-next-line unicorn/no-null
    null,
  );
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(
    // eslint-disable-next-line unicorn/no-null
    null,
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    strategy: "fixed",
  });

  const [root] = useState(() => document.createElement("div"));
  useEffect(() => {
    document.body.append(root);
    return () => root.remove();
  }, [root]);

  return (
    <div className="relative items-center flex">
      <HeadlessMenu as="div" className="relative inline-block text-left">
        <HeadlessMenu.Button
          ref={setReferenceElement}
          className={clsx(
            btnClassName,
            "flex",
            theme.focusVisible,
            "items-center",
          )}
          onClick={(event) => {
            onClick?.(event);
          }}
        >
          {title && <div className="pl-2">{title}</div>}
          {icon}
        </HeadlessMenu.Button>

        {createPortal(
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              ref={setPopperElement}
              className="z-50"
              style={styles["popper"]}
              {...attributes["popper"]}
            >
              <HeadlessMenu.Items
                className={clsx(
                  "absolute right-0 mt-2 w-56 origin-top-right",
                  "rounded shadow-lg z-20 border",
                  "divide-y divide-slate-100 dark:divide-slate-700",
                  theme.bgInput,
                  theme.borderInput,
                  theme.focusVisible,
                )}
              >
                {children}
                <div className="p-1">
                  {items.map((item, index) => (
                    <HeadlessMenu.Item key={item.label || index}>
                      {({ active }) => (
                        <div>
                          {item.type === "separator" && (
                            <div className="h-[1px] bg-gray-100 my-0.5" />
                          )}
                          {item.type !== "separator" && (
                            <button
                              key={item.label}
                              disabled={item.disabled}
                              onClick={item.onClick}
                              className={clsx(
                                active && theme.bg3,
                                "group flex w-full items-center rounded px-2 py-2 text-sm",
                                theme.textInput,
                                "flex gap-x-3",
                                item.disabled &&
                                  "cursor-not-allowed opacity-50",
                              )}
                            >
                              {item.icon && (
                                <span className={clsx(theme.text2)}>
                                  {item.icon}
                                </span>
                              )}
                              <div className="flex grow">{item.label}</div>
                            </button>
                          )}
                        </div>
                      )}
                    </HeadlessMenu.Item>
                  ))}
                </div>
              </HeadlessMenu.Items>
            </div>
          </Transition>,
          root,
        )}
      </HeadlessMenu>
    </div>
  );
};
