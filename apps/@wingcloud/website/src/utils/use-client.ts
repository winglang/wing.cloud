import {
  useQuery,
  useMutation,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

export const useClient = (apiUrl: string) => {
  const query = <T>(
    route: string,
    params?: Record<string, unknown>,
    options?: UseQueryOptions<T>,
  ) => {
    const fetchUrl = new URL(`${apiUrl}/${route}`);

    for (const key in params) {
      fetchUrl.searchParams.append(key, params[key] as string);
    }

    return useQuery<T>({
      queryKey: [route, params],
      queryFn: async () => {
        const response = await fetch(fetchUrl.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.json();
      },
      ...options,
    });
  };

  const mutation = <T, R>(
    route: string,
    options?: UseMutationOptions<R, Error, T>,
  ) => {
    const mutate = async (variables: T) => {
      const response = await fetch(`${apiUrl}/${route}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables),
      });
      return response.json();
    };

    return useMutation<R, Error, T>(mutate, {
      ...options,
    });
  };

  return { query, mutation };
};
