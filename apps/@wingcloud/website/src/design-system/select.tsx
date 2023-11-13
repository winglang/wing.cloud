import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";

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
  }: SelectProps) => {
    const { theme } = useTheme();

    const [referenceElement, setReferenceElement] =
      useState<HTMLElement | null>(
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
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {() => (
          <div className={clsx("relative inline-block", className)}>
            <div ref={setReferenceElement} className="w-full">
              <Listbox.Button
                as="button"
                className={clsx(
                  btnClassName,
                  "w-full pr-8 text-left relative",
                  "items-center px-2.5 py-1.5 border text-xs rounded",
                  theme.bgInput,
                  theme.textInput,
                  theme.borderInput,
                  theme.focusInput,
                )}
              >
                {placeholder && !value && (
                  <div className={clsx("truncate", theme.text1)}>
                    {placeholder}
                  </div>
                )}
                <div className="truncate">
                  {items.find((item) => item.value === value)?.label ?? value}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                  <ChevronUpDownIcon
                    className={clsx("h-4 w-4", theme.textInput)}
                    aria-hidden="true"
                  />
                </div>
              </Listbox.Button>
            </div>

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
                  style={styles.popper}
                  {...attributes.popper}
                >
                  <Listbox.Options
                    className={clsx(
                      theme.bgInput,
                      theme.textInput,
                      "z-10 m-1 max-h-60 w-full overflow-auto rounded-md",
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
                                <CheckIcon
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : undefined}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Transition>,
              root,
            )}
          </div>
        )}
      </Listbox>
    );
  },
);
