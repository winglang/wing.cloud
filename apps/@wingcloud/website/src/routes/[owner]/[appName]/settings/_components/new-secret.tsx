import { ExclamationCircleIcon, TagIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { Button } from "../../../../../design-system/button.js";
import { Input } from "../../../../../design-system/input.js";
import { Select } from "../../../../../design-system/select.js";
import { useTheme } from "../../../../../design-system/theme-provider.js";
import type { EnvironmentType } from "../../../../../utils/wrpc.js";

const environmentTypes = [
  { value: "production", label: "production" },
  { value: "preview", label: "preview" },
];

export const NewSecret = ({
  loading,
  onCreate,
}: {
  loading: boolean;
  onCreate: (
    name: string,
    value: string,
    environmentType: EnvironmentType,
  ) => Promise<void>;
}) => {
  const { theme } = useTheme();
  const [environmentType, setEnvironmentType] = useState<EnvironmentType>();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const create = useCallback(async () => {
    try {
      await onCreate(name, value, environmentType!);
      setName("");
      setValue("");
      setEnvironmentType(undefined);
    } catch {}
  }, [name, value, environmentType]);

  const isSaveDisabled = useMemo(() => {
    return loading || !name || !value || !environmentType;
  }, [loading, name, value, environmentType]);

  return (
    <div className={clsx("bg-white rounded text-left w-full block")}>
      <div className="flex grow items-center gap-x-4">
        <div className="flex flex-col text-xs w-1/3 gap-2">
          <span>Key</span>
          <Input
            type="text"
            value={name}
            placeholder="e.g. API_KEY"
            onChange={(evt) => setName(evt.currentTarget.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col text-xs w-1/3 gap-2">
          <span>Value</span>
          <Input
            type="text"
            value={value}
            onChange={(evt) => setValue(evt.currentTarget.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col text-xs w-1/3 gap-2">
          <span>Type</span>
          <Select
            value={environmentType || ""}
            items={environmentTypes}
            placeholder="Select an option"
            onChange={(value) => setEnvironmentType(value as EnvironmentType)}
            renderItem={(item) => {
              return (
                <div className="flex items-center gap-2">
                  <TagIcon className={clsx("w-4 h-4 inline-block")} />
                  {item.label}
                </div>
              );
            }}
          />
        </div>

        <div className="self-end">
          <div className="flex flex-col justify-between gap-3 h-full items-end">
            <Button
              className="truncate"
              onClick={create}
              disabled={isSaveDisabled}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
      <hr className="h-px mb-2 mt-4 bg-slate-200 border-0 dark:bg-slate-700" />
      <div className="flex flex-row gap-2">
        <ExclamationCircleIcon
          className={clsx("h-4 w-4 flex-shrink-0", theme.text2)}
        />
        <span className={clsx("text-xs truncate", theme.text2)}>
          Learn more about{" "}
          <a
            className={clsx(
              "text-blue-600",
              "focus:underline outline-none",
              "hover:underline z-10 cursor-pointer",
            )}
            href="https://www.winglang.io/docs/language-reference#112-execution-model"
            target="_blank"
          >
            environment types
          </a>{" "}
        </span>
      </div>
    </div>
  );
};
