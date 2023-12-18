const getPath = () => {
  const location = window.location.href;
  const path = location.split("/").splice(3);
  return path;
};

const getOwner = () => {
  return getPath()[0] || "";
};

const getApp = () => {
  return getPath()[1] || "";
};

const getEnv = () => {
  return getPath()[2] || "";
};
export const useGetPathDetails = () => {
  return {
    getOwner,
    getApp,
    getEnv,
  };
};
