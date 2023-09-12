import { trpc } from "../utils/trpc.js";

export const Message = () => {
  const getUserById = trpc.getUserById.useQuery();

  return (
    <>
      <h1>hello world!!</h1>

      <code>{JSON.stringify(getUserById.data)}</code>
    </>
  );
};
