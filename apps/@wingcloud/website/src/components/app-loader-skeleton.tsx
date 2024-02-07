import clsx from "clsx";

import { HeaderSkeleton } from "./header-skeleton.js";
import { SpinnerLoader } from "./spinner-loader.js";

export const AppLoaderSkeleton = () => {
  return (
    <div
      className={clsx(
        "w-full h-full flex flex-col rounded-md text-center align-middle absolute",
      )}
    >
      <HeaderSkeleton />
      <div className="flex flex-row h-full w-full justify-center">
        <SpinnerLoader className={"self-center"} />
      </div>
    </div>
  );
};
