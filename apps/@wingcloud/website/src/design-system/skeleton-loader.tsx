import clsx from "clsx";
import { type PropsWithChildren } from "react";

export interface SkeletonProps {
  className?: string;
  title?: string;
  isLoading?: boolean;
}

export const SkeletonLoader = ({
  className,
  title,
  children,
  isLoading = true,
}: PropsWithChildren<SkeletonProps>) => {
  return (
    <div className={clsx(["relative", className])} title={title}>
      <div className={clsx(isLoading && "invisible", className)}>
        {children}
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-300 animate-pulse rounded-sm" />
      )}
    </div>
  );
};
