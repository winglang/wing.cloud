import { GithubLogin } from "../components/github-login.js";
import { trpc } from "../utils/trpc.js";

export const Component = () => {
  const self = trpc.self.useQuery();
  return (
    <div className="p-6">
      <GithubLogin />

      <div>self: {self.data?.userId}</div>
    </div>
  );
};
