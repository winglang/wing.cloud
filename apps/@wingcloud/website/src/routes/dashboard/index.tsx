import { Link, Outlet } from "react-router-dom";

export const Component = () => {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  );
};
