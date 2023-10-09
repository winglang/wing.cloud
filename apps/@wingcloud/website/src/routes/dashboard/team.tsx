import { Link } from "react-router-dom";

import { Message } from "../../components/message.js";

export const Component = () => {
  return (
    <>
      <h1>Team</h1>

      <div className="p-6">
        <Message />
      </div>

      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
};
