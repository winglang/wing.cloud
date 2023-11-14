import { Button } from "../../../design-system/button.js";

export interface CreateAppFooterProps {
  onCancel: () => void;
  onCreate: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const CreateAppFooter = ({
  onCancel,
  onCreate,
  disabled,
  loading,
}: CreateAppFooterProps) => {
  return (
    <div className="w-full flex">
      <div className="justify-end flex gap-x-2 grow">
        <Button onClick={onCancel} disabled={disabled}>
          Back
        </Button>
        <Button onClick={onCreate} primary disabled={disabled || loading}>
          {loading ? "Creating..." : "Create new App"}
        </Button>
      </div>
    </div>
  );
};
