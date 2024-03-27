import {
  DocumentDuplicateIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { SectionTitle } from "../../../components/section-title.js";
import { Button } from "../../../design-system/button.js";
import { Input } from "../../../design-system/input.js";
import { useNotifications } from "../../../design-system/notification.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { getTimeUntil } from "../../../utils/time.js";
import { wrpc } from "../../../utils/wrpc.js";

import { DeleteEarlyAccessModal } from "./delete-early-access-modal.js";

export const EarlyAccess = () => {
  const { theme } = useTheme();
  const { showNotification } = useNotifications();

  const [search, setSearch] = useState("");

  const [email, setEmail] = useState("");
  const isEmailValid = useMemo(() => {
    return email.match(/.+@.+\..+/);
  }, [email]);

  const createEarlyAcces = wrpc["admin.earlyAccess.create"].useMutation({
    onSuccess() {
      showNotification(`User "${email}" added to early access list`, {
        type: "success",
      });
      setEmail("");
      refetch();
    },
    onError: (error: any) => {
      showNotification(error.message, {
        type: "error",
      });
    },
  });

  const [emailToDelete, setDeleteItem] = useState<string>();

  const { data, refetch } = wrpc["admin.earlyAccess.list"].useQuery();

  const earlyAccessList = useMemo(() => {
    if (!data?.earlyAccessList) {
      return [];
    }

    return data.earlyAccessList.filter((item) =>
      item.email.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  const copyLink = useCallback(
    (code: string) => {
      navigator.clipboard.writeText(`${data?.url}/?code=${code}`);
      showNotification("Link copied to clipboard", {
        type: "success",
      });
    },
    [data?.url, showNotification],
  );

  return (
    <div className="space-y-2">
      <SectionTitle>Early access</SectionTitle>
      <div className="space-y-4">
        <div className="flex gap-x-2">
          <Input
            type="text"
            leftIcon={MagnifyingGlassIcon}
            className="block w-full"
            containerClassName="w-full"
            name="search"
            id="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
        <table
          className={clsx(
            "w-full text-sm text-left text-gray-500 dark:text-gray-400 border",
            theme.bgInput,
            theme.borderInput,
          )}
        >
          <thead className="text-xs text-gray-600 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-2 w-20 text-center"></th>
              <th className="px-4 py-2 w-1/3">Email</th>
              <th className="px-4 py-2">Expires</th>
              <th className="px-4 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {earlyAccessList.map((item) => (
              <tr
                key={item.email}
                className={clsx(
                  "border-b transition-all text-xs relative",
                  "bg-white hover:bg-slate-50",
                )}
              >
                <td className="px-4 py-2 text-center">
                  {item.used ? (
                    <div className="text-green-500">Used</div>
                  ) : (
                    <div className="text-red-500">Unused</div>
                  )}
                </td>
                <td className="px-4 py-2">{item.email}</td>
                <td className="px-4 py-2">
                  <div className="text-gray-400">
                    {getTimeUntil(item.expiresAt, true)}
                  </div>
                </td>
                <td className="px-4 py-2 flex items-center">
                  <div className="flex grow justify-between">
                    <button
                      onClick={() => {
                        copyLink(item.code);
                      }}
                      className={clsx(
                        theme.text3,
                        theme.text3Hover,
                        "flex items-center gap-x-1",
                        "hover:underline cursor-pointer",
                      )}
                    >
                      <div className="truncate">{`${data?.url}/${item.code}`}</div>
                      <DocumentDuplicateIcon className="size-4" />
                    </button>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setDeleteItem(item.email);
                        }}
                        className={clsx(
                          theme.text3,
                          theme.text3Hover,
                          "hover:underline cursor-pointer",
                        )}
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {earlyAccessList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center px-4 py-2 bg-white">
                  <div className="h-6 text-xs flex items-center justify-center">
                    No items found.
                  </div>
                </td>
              </tr>
            )}
            <tr className="bg-gray-50 border-t border-gray-100">
              <td></td>
              <td className="text-center px-3 py-2">
                <Input
                  type="email"
                  leftIcon={EnvelopeIcon}
                  className={clsx("w-full", {
                    "border-red-500": !isEmailValid && email,
                    "focus:border-red-500": !isEmailValid && email,
                  })}
                  containerClassName="w-full"
                  name="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                />
              </td>
              <td colSpan={2} className="text-center px-4 py-2">
                <div className="flex gap-x-4 items-center justify-end">
                  <Button
                    disabled={!isEmailValid}
                    onClick={() => {
                      createEarlyAcces.mutate({ email });
                    }}
                  >
                    Add
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {emailToDelete && (
        <DeleteEarlyAccessModal
          email={emailToDelete}
          show={emailToDelete !== undefined}
          onClose={(value) => {
            setDeleteItem(undefined);
            if (value) {
              refetch();
            }
          }}
        />
      )}
    </div>
  );
};
