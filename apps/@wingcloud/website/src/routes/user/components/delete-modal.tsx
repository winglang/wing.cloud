import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate, useParams } from "react-router-dom";

import { Modal } from "../../../design-system/modal.js";
import { useNotifications } from "../../../design-system/notification.js";
import { wrpc } from "../../../utils/wrpc.js";

export interface DeleteModalProps {
  appId: string;
  appName: string;
  show: boolean;
  onClose: (value: boolean) => void;
}

export const DeleteModal = ({
  appId,
  appName,
  show,
  onClose,
}: DeleteModalProps) => {
  const { user } = useParams();
  const { showNotification } = useNotifications();

  const navigate = useNavigate();

  const deleteApp = wrpc["app.delete"].useMutation({
    onSuccess() {
      showNotification(`App ${appName} deleted`, { type: "success" });
      navigate(`/${user}`);
    },
    onError(error) {
      if (error instanceof Error) {
        showNotification(error.message, { type: "error" });
      } else {
        showNotification(`Unknown error: ${error}`, { type: "error" });
      }
      onClose(false);
    },
  });

  return (
    <Modal
      show={show}
      onClose={(value) => {
        if (deleteApp.isIdle) {
          onClose(value);
        }
      }}
    >
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <ExclamationTriangleIcon
            className="h-6 w-6 text-red-600"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <Dialog.Title
            as="h3"
            className="text-base font-semibold leading-6 text-gray-900"
          >
            Delete App
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              The App{" "}
              <span className="bg-slate-200 text-slate-700 px-1 rounded">
                {appName}
              </span>{" "}
              will be permanently deleted, including its preview and production
              environments. This action is irreversible and can not be undone.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="button"
          className={clsx(
            "inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto",
            {
              "opacity-50 cursor-not-allowed": deleteApp.isPending,
            },
          )}
          disabled={deleteApp.isPending}
          onClick={() => deleteApp.mutate({ appId })}
        >
          {!deleteApp.isPending && <span>Delete</span>}
          {deleteApp.isPending && <span>Deleting...</span>}
        </button>
        <button
          type="button"
          className={clsx(
            "mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto",
            {
              "opacity-50 cursor-not-allowed": deleteApp.isPending,
            },
          )}
          disabled={deleteApp.isPending}
          onClick={() => onClose(false)}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
