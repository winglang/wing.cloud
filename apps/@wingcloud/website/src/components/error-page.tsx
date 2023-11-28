import { Link } from "react-router-dom";

export const ErrorPage = ({
  title = "Error",
  message = "Something went wrong.",
  code,
}: {
  title?: string;
  message?: string;
  code?: number;
}) => {
  return (
    <div className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8 h-full">
      <div className="text-center">
        <p className="text-base font-semibold text-sky-600">{code}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">{message}</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link to="/dashboard">Go back home</Link>
        </div>
      </div>
    </div>
  );
};
