import { Link } from "react-router-dom";

import { GithubLogin } from "../../components/github-login.js";
import { GithubProjects } from "../../components/github-projects.js";
import { Message } from "../../components/message.js";

export const Component = () => {
  return (
    <>
      <h1>Team</h1>

      <div className="p-6">
        <div className="py-4">
          <Message />
          <GithubProjects />
        </div>
      </div>

      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
};
