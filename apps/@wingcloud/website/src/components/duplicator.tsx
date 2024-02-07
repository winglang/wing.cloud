import type { PropsWithChildren } from "react";

export const Duplicator = ({
  count,
  children,
}: PropsWithChildren<{
  count: number;
}>) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </>
  );
};
