import { Link } from "react-router-dom";

import { Message } from "../components/message.js";

export const Component = () => {
  return (
    <>
      <h1>Team</h1>

      <Message />

      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
};
