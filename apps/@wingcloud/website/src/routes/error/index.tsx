import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { HeaderSkeleton } from "../../components/header-skeleton.js";
import { Header } from "../../components/header.js";
import { HttpErrorPage } from "../../components/http-error-page.js";

export const Component = () => {
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const errorBase64 = searchParams.get("error") ?? "";

  useEffect(() => {
    try {
      const errorString = atob(errorBase64);
      const error = JSON.parse(errorString);

      setCode(error.code);
      setErrorMessage(error.message);

      console.log("error", error);
    } catch {
      setCode("500");
      setErrorMessage("Something went wrong");
    }
  }, [errorBase64]);

  return (
    <>
      <HeaderSkeleton loading={false} />
      <HttpErrorPage
        code={Number.parseInt(code)}
        title="Something went wrong"
        message={errorMessage}
      />
    </>
  );
};
