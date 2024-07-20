import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

/**
 * The GET note function handler.
 * @param event extract the userId and the noteId from the pathParameters
 * @returns the noteContent of the item we retrieved from the database (using the .S syntax to get the string value).
 */
export const handler = async (event: {
  pathParameters: { userId?: string; id?: string };
}): Promise<{ statusCode: number; body: string }> => {
  const { userId, id: noteId } = event.pathParameters ?? {};

  if (userId === undefined || noteId === undefined) {
    return {
      statusCode: 400,
      body: "bad request",
    };
  }

  /**
   * The AWS SDK is used to send GetItemCommand to the database.
   * Using the Key parameter, get the item with PK equal to "note" and SK equal to noteId.
   * Use process.env.TABLE_NAME for the name of the table.
   */
  const { Item } = await client.send(
    new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: { S: userId },
        SK: { S: noteId },
      },
    })
  );

  if (Item === undefined) {
    return {
      statusCode: 404,
      body: "not found",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      id: noteId,
      content: Item.noteContent.S,
    }),
  };
};
