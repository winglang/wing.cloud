import { type PropsWithChildren } from "react";

import { Header } from "../components/header.js";

export const Layout = ({ children }: PropsWithChildren) => {
  return <div className="w-full h-full grow font-sans">{children}</div>;
};
