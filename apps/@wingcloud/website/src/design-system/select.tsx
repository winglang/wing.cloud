import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, memo, useEffect, useMemo, useState } from "react";

import { useTheme } from "./theme-provider.js";
interface Item {
  label?: string;
  value: string;
}

export interface SelectProps {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  btnClassName?: string;
  showSelected?: boolean;
  renderItem?: (item: Item) => JSX.Element;
}

export const Select = memo(
  ({
    items = [],
    value,
    onChange,
    disabled = false,
    placeholder,
    className,
    btnClassName,
    showSelected = true,
    renderItem,
  }: SelectProps) => {
    const { theme } = useTheme();

    const [root] = useState(() => document.createElement("div"));
    useEffect(() => {
      document.body.append(root);
      return () => root.remove();
    }, [root]);

    const selected = useMemo(() => {
      return items.find((item) => item.value === value);
    }, [items, value]);

    return (
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {() => (
          <div className={clsx("relative inline-block", className)}>
            <div className="w-full">
              <Listbox.Button
                as="button"
                aria-disabled={disabled}
                className={clsx(
                  btnClassName,
                  "w-full pr-8 text-left relative",
                  "items-center px-2.5 py-1.5 border text-xs rounded-md",
                  theme.bgInput,
                  theme.textInput,
                  theme.borderInput,
                  theme.focusInput,
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                {placeholder && !value && (
                  <div className={clsx("truncate", theme.text1)}>
                    {placeholder}
                  </div>
                )}

                {value && (
                  <div className="truncate">
                    {renderItem
                      ? renderItem(selected ?? { value: "" })
                      : selected?.label ?? selected?.value}
                  </div>
                )}

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                  <ChevronUpDownIcon
                    className={clsx("h-4 w-4", theme.textInput)}
                    aria-hidden="true"
                  />
                </div>
              </Listbox.Button>
            </div>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={clsx(
                  "absolute",
                  theme.bgInput,
                  theme.textInput,
                  "z-10 mt-1 max-h-60 w-full overflow-auto rounded-md",
                  "py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 outline-none",
                )}
              >
                {placeholder && (
                  <Listbox.Option
                    className={({ active }) =>
                      clsx(
                        "relative cursor-default select-none py-2 px-4",
                        active && theme.bgInputHover,
                        (showSelected && "pl-8") || "pl-4",
                      )
                    }
                    value=""
                  >
                    <span className="block truncate">{placeholder}</span>
                  </Listbox.Option>
                )}
                {items.map((item, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      clsx(
                        "relative cursor-default select-none py-2 px-4",
                        active && theme.bgInputHover,
                        (showSelected && "pl-8") || "pl-4",
                      )
                    }
                    value={item.value}
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={clsx(
                            "block truncate",
                            selected ? "font-medium" : "font-normal",
                          )}
                        >
                          {item.label ?? item.value}
                        </span>
                        {showSelected && selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sky-600">
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : undefined}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    );
  },
);
