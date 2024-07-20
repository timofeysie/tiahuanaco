import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});

/**
 * Note PUT function handler.
 * Parameters are pathParameters and body based on the configuration the REST API.
 * @param event 
 * @returns the noteId to the client and a success status code, in order to be able to retrieve the note later.
 */
export const handler = async (event: {
  body: string;
  pathParameters: { userId?: string };
}): Promise<{ statusCode: number; body: string }> => {
  const { content } = JSON.parse(event.body) as { content?: string };
  // extract a userId from the pathParameters and the content of the future note from the parsed body
  const { userId } = event.pathParameters ?? {};

  if (userId === undefined || content === undefined) {
    return {
      statusCode: 400,
      body: "bad request",
    };
  }

  const noteId = uuidv4();

  /**
   * Use the AWS SDK to send a PutItemCommand to the database.
   * The PK is "note" and the SK is the noteId.
   * The noteContent is the content of the note, it is an additional key.
   * All keys are defined using the S type, an AWS-special syntax indicating that the stored value will be a string.
   * process.env.TABLE_NAME provides the name of the table, which is defined in the environment variables of the Lambda function.
   */
  await client.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        PK: { S: userId },
        SK: { S: noteId },
        noteContent: { S: content },
      },
    })
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ noteId }),
  };
};
