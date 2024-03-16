import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { Modal } from "../design-system/modal.js";
export interface ConfirmationModalProps {
  show: boolean;
  onClose: (value: boolean) => void;
  isPending: boolean;
  isIdle: boolean;
  onConfirm: () => void;
  modalTitle: string;
  modalBody: React.ReactNode;
  confirmButtonText?: string;
  confirmButtonTextPending?: string;
  type?: "danger" | "warning";
}
const defaultConfirmButtonText = "Confirm";
const defaultConfirmButtonTextPending = "Loading...";
export const ConfirmationModal = ({
  onConfirm,
  isIdle,
  isPending,
  show,
  onClose,
  modalTitle,
  modalBody,
  confirmButtonText = defaultConfirmButtonText,
  confirmButtonTextPending = defaultConfirmButtonTextPending,
  type = "danger",
}: ConfirmationModalProps) => {
  return (
    <Modal
      show={show}
      onClose={(value) => {
        if (isIdle) {
          onClose(value);
        }
      }}
    >
      <div className="sm:flex sm:items-start">
        <div
          className={clsx(
            "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10",
            type === "danger" && "bg-red-100",
            type === "warning" && "bg-yellow-100",
          )}
        >
          <ExclamationTriangleIcon
            className={clsx(
              "h-6 w-6",
              type === "danger" && "text-red-600",
              type === "warning" && "text-yellow-600",
            )}
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <Dialog.Title
            as="h3"
            className="text-base font-semibold leading-6 text-slate-900"
          >
            {modalTitle}
          </Dialog.Title>
          <div className="mt-2">{modalBody}</div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          data-testid="modal-confirm-button"
          type="button"
          className={clsx(
            "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto",
            type === "danger" && "bg-red-600 hover:bg-red-500 text-white",
            type === "warning" && [
              "text-white",
              "bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600",
              "border-sky-700",
            ],
            {
              "opacity-50 cursor-not-allowed": isPending,
            },
          )}
          disabled={isPending}
          onClick={() => onConfirm()}
        >
          {!isPending && <span>{confirmButtonText}</span>}
          {isPending && <span>{confirmButtonTextPending}</span>}
        </button>
        <button
          type="button"
          className={clsx(
            "mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto",
            {
              "opacity-50 cursor-not-allowed": isPending,
            },
          )}
          disabled={isPending}
          onClick={() => onClose(false)}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};
