import { Menu as HeadlessMenu, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

interface Item {
  label?: string;
  onClick: () => void;
}

export interface MenuProps {
  title?: string;
  icon?: React.ReactNode;
  items: Item[];
  btnClassName?: string;
}

export const Menu = ({ title, icon, items = [], btnClassName }: MenuProps) => {
  return (
    <div className="relative items-center flex">
      <HeadlessMenu as="div" className="relative inline-block text-left">
        <div>
          <HeadlessMenu.Button
            className={clsx(
              "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
              btnClassName,
            )}
          >
            {icon}
            {title && <span className="ml-2">{title}</span>}
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
          <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
            <div className="px-1 py-1 ">
              {items.map((item) => (
                <HeadlessMenu.Item key={item.label}>
                  {({ active }) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className={clsx(
                        active && "bg-slate-100",
                        "group flex w-full items-center rounded-md px-2 py-2 text-sm",
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
