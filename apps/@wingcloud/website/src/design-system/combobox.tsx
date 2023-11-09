import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useRef } from "react";
import { Fragment, useEffect, useState } from "react";

interface Item {
  label?: string;
  value: string;
}

export interface ComboboxProps {
  items?: Item[];
  value: string;
  onChange: (selected: string) => void;
  disabled?: boolean;
  filter?: boolean;
  placeholder?: string;
  renderItem?: (item: Item) => JSX.Element;
}

export const Combobox = ({
  items,
  value,
  onChange,
  placeholder = "Select an option",
  disabled,
  filter = true,
  renderItem,
}: ComboboxProps) => {
  const [filtered, setFiltered] = useState<Item[]>(items ?? []);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = useMemo(() => {
    return items?.find((item) => item.value === value)?.label;
  }, [items, value]);

  useEffect(() => {
    if (items === undefined) {
      setFiltered([]);
      return;
    }
    if (value === "" || !filter) {
      setFiltered(items);
      return;
    }
    setFiltered(
      items.filter((item) => {
        return item.label?.toLowerCase().includes(value?.toLowerCase());
      }),
    );
  }, [items, value, filter]);

  const internalOnChange = useCallback(
    (selected: string) => {
      onChange(selected);
      inputRef.current?.focus();
    },
    [onChange],
  );

  return (
    <HeadlessCombobox value={value} onChange={internalOnChange}>
      <div className="relative w-full">
        <HeadlessCombobox.Input
          className={clsx(
            "w-full rounded-md bg-white py-1.5 pl-3 pr-10 text-slate-900",
            "shadow-sm text-sm",
            "border border-slate-300",
            "focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none",
          )}
          value={label}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <HeadlessCombobox.Button
          aria-disabled={disabled}
          className={clsx(
            "absolute inset-0 flex items-center px-2 w-full",
            "outline-none",
          )}
        >
          <ChevronDownIcon className="h-4 w-4 text-slate-400 absolute right-2" />
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
                className={({ active }) =>
                  clsx(
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    active && "bg-slate-50",
                  )
                }
              >
                {({ active, selected }) => (
                  <>
                    <span
                      className={clsx(
                        "block truncate",
                        selected && "font-semibold",
                      )}
                    >
                      {renderItem ? renderItem(item) : item.label ?? item.value}
                    </span>

                    {selected && (
                      <span
                        className={clsx(
                          "absolute inset-y-0 right-0 flex items-center pr-4",
                          active ? "text-white" : "text-sky-600",
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </HeadlessCombobox.Option>
            ))}
          </HeadlessCombobox.Options>
        )}
      </div>
    </HeadlessCombobox>
  );
};
