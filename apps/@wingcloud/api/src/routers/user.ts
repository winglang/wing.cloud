import { t } from "../trpc.js";

export type User = {
  id: string;
  name: string;
  bio?: string;
};

export const router = t.router({
  getUserById: t.procedure.query(async ({ ctx }) => {
    await ctx.dynamodb.putItem({
      TableName: ctx.tableName,
      Item: {
        pk: { S: "user" },
        sk: { S: "#" },
        name: { S: "Cristian" },
      },
    });
    const { Item } = await ctx.dynamodb.getItem({
      TableName: ctx.tableName,
      Key: {
        pk: { S: "user" },
        sk: { S: "#" },
      },
    });
    return Item;
  }),
});
