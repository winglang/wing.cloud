import { Link } from "react-router-dom";

export const NoMatch = () => {
  return (
    <div>
      <h1>404</h1>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
};
