import { Link, Outlet } from "react-router-dom";

export const Component = () => {
  return (
    <>
      <h1>Index</h1>

      <Outlet />

      <p>
        <Link to="/team">Go to the team page</Link>
      </p>
    </>
  );
};
