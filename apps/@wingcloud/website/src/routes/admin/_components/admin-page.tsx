import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

import { SectionTitle } from "../../../components/section-title.js";
import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Input } from "../../../design-system/input.js";
import { wrpc } from "../../../utils/wrpc.js";

import { UsersTable } from "./users-table.js";

export interface AdminPageProps {
  ownerParam: string;
}

export const AdminPage = (props: AdminPageProps) => {
  const [search, setSearch] = useState("");

  const { isLoading, data, refetch } = wrpc["admin.users.list"].useQuery();

  const filteredUsers = useMemo(() => {
    if (!data?.users) {
      return [];
    }

    return data.users.filter((user) =>
      user.username.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-x-2">
        <Input
          type="text"
          leftIcon={MagnifyingGlassIcon}
          className="block w-full"
          containerClassName="w-full"
          name="search"
          id="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
      </div>
      {isLoading && (
        <div className="w-full flex justify-center p-4">
          <SpinnerLoader />
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-wrap gap-6 w-full">
          <div className="w-full space-y-2">
            <SectionTitle>
              <div className="flex items-center gap-x-2">
                <div className="flex gap-x-1">
                  <span>Users</span>
                  <span className="text-gray-500 font-normal">
                    ({filteredUsers.length})
                  </span>
                </div>
              </div>
            </SectionTitle>
            <div className="overflow-x-auto relative shadow-sm rounded-md w-full">
              <UsersTable users={filteredUsers} refetch={refetch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
