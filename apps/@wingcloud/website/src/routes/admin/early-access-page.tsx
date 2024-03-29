import {
  DocumentDuplicateIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";

import { SectionTitle } from "../../components/section-title.js";
import { Button } from "../../design-system/button.js";
import { Input } from "../../design-system/input.js";
import { useNotifications } from "../../design-system/notification.js";
import { useTheme } from "../../design-system/theme-provider.js";
import { getDateTime } from "../../utils/time.js";
import { EARLY_ACCESS_CODE_QUERY_PARAM, wrpc } from "../../utils/wrpc.js";

import { DeleteEarlyAccessModal } from "./_components/delete-early-access-modal.js";

const EarlyAccessPage = () => {
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

      <div
        className={clsx(
          "w-full text-xs text-gray-500 dark:text-gray-400 border",
          theme.bgInput,
          theme.borderInput,
          "grid grid-cols-7",
        )}
      >
        <div className="col-span-2 font-bold text-gray-600 uppercase bg-gray-50 px-4 py-2">
          Email
        </div>
        <div className="font-bold text-gray-600 uppercase bg-gray-50 px-4 py-2">
          Expires
        </div>
        <div className="col-span-3 font-bold text-gray-600 uppercase bg-gray-50 px-4 py-2">
          Link
        </div>
        <div className="bg-gray-50 px-4 py-2" />

        {earlyAccessList.map((item) => (
          <>
            <div className="col-span-2 px-4 py-2 flex items-center truncate">
              <div className="truncate">{item.email}</div>
            </div>
            <div className="px-4 py-2 flex items-center truncate">
              <div className="truncate">{getDateTime(item.expiresAt)}</div>
            </div>
            <div className="col-span-3 flex items-center px-4 py-2 gap-x-2 grow justify-between">
              <div
                className={clsx(
                  theme.text2,
                  "group flex items-center",
                  "truncate",
                  "gap-x-1",
                )}
              >
                <div className="truncate" title={getUrl(item.code)}>
                  {getUrl(item.code)}
                </div>
                <button
                  className={clsx(
                    theme.text3,
                    theme.text3Hover,
                    "cursor-pointer",
                    "p-1 rounded hover:bg-gray-100",
                  )}
                  onClick={() => {
                    copyLink(item.code);
                  }}
                >
                  <DocumentDuplicateIcon className="size-4" />
                </button>
                <div className="text-gray-500 italic ml-1">
                  {item.used ? "(Used)" : "(Not used)"}
                </div>
              </div>
            </div>
            <div className="flex justify-end px-4 py-2">
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
          </>
        ))}
        {earlyAccessList.length === 0 && (
          <div className="col-span-7 text-center px-4 py-2 bg-white">
            <div className="h-6 text-xs flex items-center justify-center">
              No items found.
            </div>
          </div>
        )}
        <>
          <div
            className={clsx(
              "col-span-2",
              "text-center px-4 py-2",
              "bg-gray-50 border-t border-gray-100",
            )}
          >
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
          </div>
          <div
            className={clsx(
              "col-span-5",
              "text-center px-4 py-2",
              "bg-gray-50 border-t border-gray-100",
            )}
          >
            <div className="flex gap-x-4 items-center justify-end">
              <Button
                disabled={!isEmailValid}
                onClick={() => {
                  createEarlyAcces.mutate({ email });
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </>
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

export const Component = () => {
  return <EarlyAccessPage />;
};
