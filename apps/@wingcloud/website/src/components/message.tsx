import { useEffect } from "react";

import { trpc } from "../utils/trpc.js";

export const Message = () => {
  // const getUserById = trpc.getUserIdFromLogin.useQuery({
  //   login: "skyrpex",
  // });

  //const validateUserId = trpc.validateUserId.useMutation();

  const allUsers = trpc.allUsers.useQuery();

  // useEffect(() => {
  //   validateUserId.mutate({
  //     login: "skyrpex",
  //   });
  // }, []);

  return (
    <table className="w-1/2 border-slate-400 border">
      <thead>
        <tr>
          <th style={{ textAlign: "left" }} className="w-1/3">
            pk
          </th>
          <th
            style={{ textAlign: "left", paddingLeft: "8px" }}
            className="w-1/3"
          >
            sk
          </th>
          <th
            style={{ textAlign: "left", paddingLeft: "8px" }}
            className="w-1/3"
          >
            data
          </th>
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
  );
};
