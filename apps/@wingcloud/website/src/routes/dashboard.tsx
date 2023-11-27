import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { SpinnerLoader } from "../components/spinner-loader.js";
import { wrpc } from "../utils/wrpc.js";

export const Component = () => {
  const navigate = useNavigate();

  const user = wrpc["user.get"].useQuery();
  useEffect(() => {
    if (!user?.data?.username) {
      navigate("/");
      return;
    }
    navigate(`/${user.data.username}`);
  }, [user.data, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <SpinnerLoader />
    </div>
  );
};
