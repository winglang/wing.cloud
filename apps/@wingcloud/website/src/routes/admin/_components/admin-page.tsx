import { EarlyAccessTable } from "./early-access-table.js";
import { UsersTable } from "./users-table.js";

export interface AdminPageProps {
  ownerParam: string;
}

export const AdminPage = (props: AdminPageProps) => {
  return (
    <div className="space-y-4">
      <UsersTable />
      <EarlyAccessTable />
    </div>
  );
};
