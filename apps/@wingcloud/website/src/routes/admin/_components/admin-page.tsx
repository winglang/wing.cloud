import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { SectionContent } from "../../../components/section-content.js";
import { SectionTitle } from "../../../components/section-title.js";
import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Input } from "../../../design-system/input.js";
import { wrpc } from "../../../utils/wrpc.js";

import { EarlyAccess } from "./early-access.js";
import { UsersTable } from "./users-table.js";

export interface AdminPageProps {
  ownerParam: string;
}

export const AdminPage = (props: AdminPageProps) => {
  return (
    <div className="space-y-4">
      <UsersTable />
      <EarlyAccess />
    </div>
  );
};
