import { MagnifyingGlassIcon, UserIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";

import { SpinnerLoader } from "../../../components/spinner-loader.js";
import { Input } from "../../../design-system/input.js";
import { useTheme } from "../../../design-system/theme-provider.js";
import { wrpc } from "../../../utils/wrpc.js";

export interface AdminPageProps {
  ownerParam: string;
}

export const AdminPage = (props: AdminPageProps) => {
  const { theme } = useTheme();

  const [search, setSearch] = useState("");

  const { isLoading, data, isFetching } = wrpc["admin.users.list"].useQuery();

  const users = useMemo(() => {
    if (data) {
      return data.users;
    }
    return [];
  }, [data]);

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

      {!isLoading && users.length === 0 && (
        <div className="text-center">
          <UserIcon className={clsx("w-12 h-12 mx-auto", theme.text2)} />
          <h3 className={clsx("mt-2 text-sm font-medium", theme.text1)}>
            No users found.
          </h3>
        </div>
      )}

      <div
        className={clsx(
          "flex flex-wrap gap-6 w-full",
          "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1",
        )}
      >
        {isLoading && <SpinnerLoader size="lg" />}

        {users.map((user) => (
          <div>{user.email}</div>
        ))}
      </div>
    </div>
  );
};
