import clsx from "clsx";
import { type PropsWithChildren } from "react";

export interface SkeletonProps {
  className?: string;
  title?: string;
  loading?: boolean;
}

export const SkeletonLoader = ({
  className,
  title,
  children,
  loading = false,
}: PropsWithChildren<SkeletonProps>) => {
  return (
    <div className={clsx(["relative", className])} title={title}>
      <div className={clsx(loading && "invisible", className)}>{children}</div>
      {loading && (
        <div className="absolute inset-0 bg-slate-300 animate-pulse rounded-sm" />
      )}
    </div>
  );
};
