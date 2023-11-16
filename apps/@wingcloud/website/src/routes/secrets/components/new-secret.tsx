import { ExclamationCircleIcon, TagIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { Button } from "../../../design-system/button.js";
import { Input } from "../../../design-system/input.js";
import { useNotifications } from "../../../design-system/notification.js";
import { Select } from "../../../design-system/select.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";
import type { EnvironmentType } from "../../../utils/wrpc.js";

const environmentTypes = [
  { value: "production", label: "production" },
  { value: "preview", label: "preview" },
];

export const NewSecret = ({ appId }: { appId: string }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [environmentType, setEnvironmentType] = useState<EnvironmentType>();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  const createMutation = wrpc["app.createSecret"].useMutation();

  const create = useCallback(async () => {
    try {
      setLoading(true);
      await createMutation.mutateAsync({
        appId,
        environmentType: environmentType!,
        name,
        value,
      });
      setName("");
      setValue("");
      // eslint-disable-next-line unicorn/no-useless-undefined
      setEnvironmentType(undefined);
      showNotification("Secret created");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error instanceof Error) {
        showNotification("Failed to create secret", {
          body: error.message,
          type: "error",
        });
      }
    }
  }, [name, value, environmentType, createMutation]);

  return (
    <div className={clsx("bg-white rounded text-left w-full block")}>
      <div className="flex grow items-center gap-x-4">
        <div className="flex flex-col text-xs w-1/3">
          <span>Key</span>
          <Input
            type="text"
            value={name}
            placeholder="e.g. API_KEY"
            onChange={(evt) => setName(evt.currentTarget.value)}
            className="mt-2 w-full"
          />
        </div>

        <div className="flex flex-col text-xs w-1/3">
          <span>Value</span>
          <Input
            type="text"
            value={value}
            onChange={(evt) => setValue(evt.currentTarget.value)}
            className="mt-2 w-full"
          />
        </div>

        <div className="flex flex-col text-xs w-1/3">
          <span>Type</span>
          <Select
            value={environmentType || ""}
            items={environmentTypes}
            placeholder="Select an option"
            onChange={(value) => setEnvironmentType(value as EnvironmentType)}
            className="mt-2"
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
            <Button className="truncate" onClick={create} disabled={loading}>
              Save
            </Button>
          </div>
        </div>
      </div>
      <hr className="h-px mb-2 mt-4 bg-gray-200 border-0 dark:bg-gray-700" />
      <div className="flex flex-row gap-2">
        <ExclamationCircleIcon
          className={clsx("h-4 w-4 flex-shrink-0", theme.text2)}
        />
        <span className={clsx("text-xs truncate", theme.text2)}>
          Learn more about{" "}
          <a
            className="text-blue-600"
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
