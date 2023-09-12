import { useEffect } from "react";

import { trpc } from "../utils/trpc.js";

export const Message = () => {
  // const getUserById = trpc.getUserIdFromLogin.useQuery({
  //   login: "skyrpex",
  // });

  const validateUserId = trpc.validateUserId.useMutation();

  const allUsers = trpc.allUsers.useQuery();

  useEffect(() => {
    validateUserId.mutate({
      login: "skyrpex",
    });
  }, []);

  return (
    <>
      <h1>hello world!!</h1>

      {/* <code>{JSON.stringify(getUserById.data)}</code> */}
      <code>
        <pre>{JSON.stringify(allUsers.data, undefined, 2)}</pre>
      </code>
    </>
  );
};
