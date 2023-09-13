import { useEffect } from "react";

import { trpc } from "../utils/trpc.js";

export const Message = () => {
  // const getUserById = trpc.getUserIdFromLogin.useQuery({
  //   login: "skyrpex",
  // });

  const validateUserId = trpc.validateUserId.useMutation();

  const allUsers = trpc.allUsers.useQuery();

  useEffect(() => {
    validateUserId.mutate({
      login: "skyrpex",
    });
  }, []);

  return (
    <>
      <h1>hello world!!</h1>

      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>pk</th>
            <th style={{ textAlign: "left", paddingLeft: "8px" }}>sk</th>
            <th style={{ textAlign: "left", paddingLeft: "8px" }}>data</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.data?.Items?.map((item: any) => {
            const { pk, sk, ...data } = item;
            return (
              <tr key={`${pk}:${sk}`}>
                <td>{pk}</td>
                <td style={{ paddingLeft: "8px" }}>{sk}</td>
                <td style={{ paddingLeft: "8px" }}>{JSON.stringify(data)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};
