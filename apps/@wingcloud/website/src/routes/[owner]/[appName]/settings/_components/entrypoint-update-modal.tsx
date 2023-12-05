import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ConfirmationModal } from "../../../../../components/confirmation-modal.js";

export interface EntrypointUpdateModalProps {
  appName: string;
  show: boolean;
  isPending: boolean;
  isIdle: boolean;
  onClose: (value: boolean) => void;
  onConfirm: () => void;
}
export const EntrypointUpdateModal = ({
  appName,
  show,
  isPending,
  isIdle,
  onClose,
  onConfirm,
}: EntrypointUpdateModalProps) => {
  const dialogBody = useMemo(
    () => (
      <p className="text-sm text-slate-500">
        Updating this property will restart all active environments for{" "}
        <span className="bg-slate-200 text-slate-700 px-1 rounded">
          {appName}
        </span>{" "}
        App
      </p>
    ),
    [appName],
  );

  return (
    <ConfirmationModal
      show={show}
      isIdle={isIdle}
      isPending={isPending}
      onClose={onClose}
      onConfirm={onConfirm}
      modalTitle={"Update Entrypoint"}
      modalBody={dialogBody}
    />
  );
};
