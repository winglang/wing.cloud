import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Component = () => {
  const navigate = useNavigate();

  const userQuery = wrpc["auth.check"].useQuery();
  useEffect(() => {
    if (!userQuery?.data?.user.username) {
      navigate("/");
      return;
    }
    navigate(`/${userQuery.data.user.username}`);
  }, [userQuery.data, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <SpinnerLoader />
    </div>
  );
};
