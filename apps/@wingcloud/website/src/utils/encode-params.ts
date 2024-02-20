import { useMemo } from "react";

export const useEncodeParams = <K extends Record<string, any>>(
  params: K,
): Record<keyof K, string> => {
  const encodedUrlParams = useMemo(() => {
    const urlParams: Partial<Record<keyof K, string>> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        urlParams[key as keyof K] = encodeURIComponent(String(value));
      }
    }
    return urlParams as Record<keyof K, string>;
  }, [params]);

  return encodedUrlParams;
};
