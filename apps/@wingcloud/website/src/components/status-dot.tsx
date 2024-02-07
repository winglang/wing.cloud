import clsx from "clsx";

export const StatusDot = ({ status }: { status: string }) => {
  return (
    <div
      title={status}
      className={clsx(
        "absolute -top-1.5 -right-1.5",
        "w-2.5 h-2.5",
        "rounded-full",
        status === "initializing" && "bg-yellow-300 animate-pulse",
        status === "deploying" && "bg-yellow-300 animate-pulse",
        status === "running" && "bg-green-300",
        status === "error" && "bg-red-300",
      )}
    />
  );
};
