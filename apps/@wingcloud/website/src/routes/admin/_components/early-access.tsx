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
import { getDateTime, getTimeUntil } from "../../../utils/time.js";
import { EARLY_ACCESS_CODE_QUERY_PARAM, wrpc } from "../../../utils/wrpc.js";

import { DeleteEarlyAccessModal } from "./delete-early-access-modal.js";

export const EarlyAccess = () => {
  const { WINGCLOUD_ORIGIN } = wing.env;

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

  const getUrl = useCallback(
    (code: string) => {
      return `${WINGCLOUD_ORIGIN}/login?${EARLY_ACCESS_CODE_QUERY_PARAM}=${code}`;
    },
    [WINGCLOUD_ORIGIN],
  );

  const copyLink = useCallback(
    (code: string) => {
      navigator.clipboard.writeText(getUrl(code));
      showNotification("Link copied to clipboard", {
        type: "success",
      });
    },
    [WINGCLOUD_ORIGIN, showNotification, getUrl],
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
                <td />
                <td className="px-4 py-2 whitespace-nowrap">{item.email}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {getDateTime(item.expiresAt)}
                </td>
                <td className="px-4 py-2 flex items-center">
                  <div className="flex grow justify-between">
                    <div className="flex items-center gap-x-1">
                      <button
                        onClick={() => {
                          copyLink(item.code);
                        }}
                        className={clsx(
                          theme.text3,
                          theme.text2Hover,
                          "group flex items-center",
                          "cursor-pointer",
                        )}
                      >
                        <div
                          className="truncate max-w-32"
                          title={getUrl(item.code)}
                        >
                          {getUrl(item.code)}
                        </div>
                        <div
                          className={clsx(
                            theme.text3,
                            theme.text3Hover,
                            "cursor-pointer",
                            "p-1 rounded hover:bg-gray-100",
                          )}
                        >
                          <DocumentDuplicateIcon className="size-4" />
                        </div>
                      </button>

                      <div className="text-gray-500 italic">
                        {item.used ? "(Used)" : "(Not used)"}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setDeleteItem(item.email);
                        }}
                        className={clsx(
                          theme.text3,
                          theme.text3Hover,
                          "cursor-pointer",
                          "p-1 rounded hover:bg-gray-100",
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
