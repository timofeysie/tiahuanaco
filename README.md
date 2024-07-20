# Tiahuanaco

This project is a Serverless backend to manage content uploaded to AWS.  The front end is [Acapana](https://github.com/timofeysie/acapana).

## Table of contents

* [Workflow](#workflow)
* [Setup](#setup)
* [Starting out](#starting-out)
* [The old starting out notes](#the-old-starting-out)
* [Serverlss Node.js Starter Docs](#serverless-Node.js-Starter-docs)

## Workflow

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

On the AWS console, see the API Gateway: apiGateway

Click on it and go to the stages tab to see the URL of the API.

Running locally:

```sh
serverless invoke local --function create --path mocks/create-event.json
```

The response should be statusCode: 200.

## Setup

```sh
> aws --version
aws-cli/2.17.4 Python/3.11.8 Windows/10 exe/AMD64
```

### Module "path" can only be default-imported using the esModuleInterop

Module '"path"' can only be default-imported using the 'esModuleInterop' flagts(1259)
path.d.ts(178, 5): This module is declared with 'export =', and can only be used with a default import when using the 'esModuleInterop' flag.

```json
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  },
```

## The API Gateway

The AWS API Gateway services is a classic "serverful" app and provides functionalities to create REST APIs that can invoke Lambda functions.

In the tiahuanaco-stack.ts file:

```ts
const tiahuanacoApi = new cdk.aws_apigateway.RestApi(this, 'tiahuanacoApi', {});
const diceResource = tiahuanacoApi.root.addResource('dice');
```

Create another handler.ts in lib\rollADice\handler.ts:

```ts
export const handler = async (): Promise<{
  statusCode: number;
  body: number;
}> => {
  const randomNumber = Math.floor(Math.random() * 6) + 1;

  return Promise.resolve({ statusCode: 200, body: randomNumber });
};
```

The format expected by API Gateway to be returned by a Lambda function is a return type a Promise of an object with a statusCode and a body.

Then associate this to a Lambda function by adding this in the my-first-app-stack.ts file inside the constructor:

```ts
    const myFirstApi = new cdk.aws_apigateway.RestApi(this, 'myFirstApi', {});
    const diceResource = myFirstApi.root.addResource('dice');
    
    const rollADiceFunction = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'rollADiceFunction', {
      entry: path.join(__dirname, 'rollADice', 'handler.ts'),
      handler: 'handler',
    });
    
    diceResource.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(rollADiceFunction));
```

Redeploy again and the GET is working fine.  Most excellent.

## DynamoDb

Tables are used to store Key-Value pairs. Each table has a primary key composed of a Partition Key (PK) and a Sort Key (SK).

* PK - used to identify a partition of the sorted data (a subset of the data),
* SK - used to sort the data within the partition. unique ID (UUID)
* attributes - sll other keys can store any kind of data

For this section we will create a POST used to create a note, and the second one a GET to read a note.

The table will look like this:

| PK (userId) | SK (noteId) | noteContent
|:-------:|:--------|:------
| user1 | note1 | "Content 1"
| user2 | note2 | "Content 2"

We will need the uui package for this:

```sh
npm install @aws-sdk/client-dynamodb uuid
npm install --save-dev @types/uuid
```

The handler function for the create function looks like this:

```ts
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
```

POST to https://<id>.execute-api.us-west-2.amazonaws.com/prod/notes/123/ returns:

```json
{
    "noteId": "2875b0ac-5ee2-4f35-a6dd-406687d5641e"
}
```

GET: to https://<id>.execute-api.us-west-2.amazonaws.com/prod/notes/123/2875b0ac-5ee2-4f35-a6dd-406687d5641e returns:

```json
{
    "id": "2875b0ac-5ee2-4f35-a6dd-406687d5641e",
    "content": "the first note"
}
```

### Homework

Up next, complete the CRUD operations for the notes API.

#### Get all notes

The clues provided says you can use the QueryCommand to list all the notes of a user, and use KeyConditionExpression and ExpressionAttributeValues to filter the items whose PK is equal to the userId.

```ts
QueryCommand({
    KeyConditionExpression: 'PK = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId },
    },
    TableName: process.env.TABLE_NAME,
  });
```

## Old Notes

This project began in 2019 mainly as a locally running Serverless project to create a series of Lambda functions.  At that time I was working for AI Media in North Sydney that used serverless and I was inspired to do my own projects.  After moving onto a new role which was a hybrid PWA app, I wasn't able to spend anymore time on Serverless.  However, I remainded a fan of IaC and the CDK.  I always wondered why more companies did not use this approach.  Fast forward to 2024, and indeed, I see a lot more uptake, and the cost efficient nature of functions versus for example a server app running in a Docker container on EC2, its a clear winner.

Check out the [old README](docs/version-one-notes.md) for details about that project.
