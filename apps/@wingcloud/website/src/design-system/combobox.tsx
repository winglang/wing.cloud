import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useRef } from "react";
import { useEffect, useState } from "react";

import { useTheme } from "./theme-provider.js";

interface Item {
  label?: string;
  value: string;
}

export interface ComboboxProps {
  items?: Item[];
  value: string;
  onChange: (selected: string) => void;
  disabled?: boolean;
  readonly?: boolean;
  filter?: boolean;
  placeholder?: string;
  renderItem?: (item: Item) => JSX.Element;
  className?: string;
}

export const Combobox = ({
  items,
  value,
  onChange,
  placeholder = "Select an option",
  disabled,
  readonly,
  filter = true,
  renderItem,
  className,
}: ComboboxProps) => {
  const { theme } = useTheme();
  const [filtered, setFiltered] = useState<Item[]>(items ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [internalValue, setInternalValue] = useState("");
  const internalOnChange = useCallback(
    (value: string) => {
      const item = items?.find((item) => item.value === value);

      if (!item) {
        onChange("");
        setInternalValue(value);
        return;
      }
      onChange(value);
      setInternalValue(item.label ?? item.value);
      inputRef.current?.focus();
    },
    [onChange, items],
  );

  useEffect(() => {
    if (items === undefined) {
      setFiltered([]);
      return;
    }
    if (internalValue === "" || !filter) {
      setFiltered(items);
      return;
    }
    setFiltered(
      items.filter((item) => {
        return item.label?.toLowerCase().includes(internalValue?.toLowerCase());
      }),
    );
  }, [items, internalValue, filter]);

  useEffect(() => {
    if (value === "") {
      setInternalValue("");
    }
  }, [value]);

  return (
    <HeadlessCombobox value={value} onChange={internalOnChange}>
      <div className={clsx("relative w-full", className)}>
        <HeadlessCombobox.Input
          ref={inputRef}
          className={clsx(
            "w-full pr-8 text-left relative",
            "items-center px-2.5 py-1.5 border text-xs rounded",
            theme.bgInput,
            theme.textInput,
            theme.borderInput,
            theme.focusInput,
            readonly && [theme.text1, "opacity-70 select-text"],
          )}
          value={internalValue}
          placeholder={placeholder}
          onChange={(event) => internalOnChange(event.target.value)}
        />
        <HeadlessCombobox.Button
          aria-disabled={disabled}
          className={clsx(
            "absolute inset-0 flex items-center px-2 w-full",
            "rounded",
            theme.borderInput,
            theme.focusVisible,
          )}
        >
          <ChevronUpDownIcon
            className={clsx("h-4 w-4 absolute right-2", theme.textInput)}
            aria-hidden="true"
          />
        </HeadlessCombobox.Button>

        {filtered.length > 0 && (
          <HeadlessCombobox.Options
            className={clsx(
              "absolute z-10 mt-1 max-h-60 w-full overflow-auto",
              "rounded bg-white py-1 shadow-lg focus:outline-none",
            )}
          >
            {filtered.map((item) => (
              <HeadlessCombobox.Option
                key={item.value}
                value={item.value}
                className={({ active, selected }) =>
                  clsx(
                    "relative cursor-default select-none py-2 pl-3 pr-8 text-xs",
                    active && "bg-slate-50",
                    selected && "bg-slate-200",
                  )
                }
              >
                <span className="block truncate">
                  {renderItem ? renderItem(item) : item.label ?? item.value}
                </span>
              </HeadlessCombobox.Option>
            ))}
          </HeadlessCombobox.Options>
        )}
      </div>
    </HeadlessCombobox>
  );
};
