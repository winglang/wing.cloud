import { Header } from "../components/header.js";
import { HttpErrorPage } from "../components/http-error-page.js";

export const Component = () => {
  return (
    <>
      <Header />
      <HttpErrorPage
        code={404}
        title="Page not found"
        message="Sorry, we couldn’t find the page you’re looking for."
      />
    </>
  );
};
