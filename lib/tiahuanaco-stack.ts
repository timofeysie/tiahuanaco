import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path from "path";
import { join } from "path";

export class TiahuanacoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * This construct creates a Lambda function using Node.js,
     * taking care of packaging (ie: we won't have to worry about importing dependencies etc...).
     * This is just the oil stick to report that the app is live.
     */
    new cdk.aws_lambda_nodejs.NodejsFunction(this, "tiahuanacoLambda", {
      // define the code that will be executed on the cloud
      entry: path.join(__dirname, "tiahuanacoLambda", "handler.ts"),
      // the function that will be executed when the Lambda is invoked
      handler: "handler",
    });

    const tiahuanacoApi = new cdk.aws_apigateway.RestApi(
      this,
      "tiahuanacoApi",
      {}
    );
    const diceResource = tiahuanacoApi.root.addResource("dice");

    /**
     * The dice GET currently returns a random number between 1 - 6.
     */
    const rollADiceFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "rollADiceFunction",
      {
        entry: path.join(__dirname, "rollADice", "handler.ts"),
        handler: "handler",
      }
    );

    /**
     * This function takes a parameter, rolls any number of dices, and returns the result.
     * For example, if you call the endpoint GET /dice/3, it should return a random number between 3 and 18.
     */
    const rollManyDicesFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "rollDicesFunction",
      {
        entry: join(__dirname, "rollManyDices", "handler.ts"),
        handler: "handler",
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        bundling: {
          externalModules: ["@aws-sdk"],
        },
      }
    );

    diceResource.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(rollManyDicesFunction)
    );

    const notesTable = new cdk.aws_dynamodb.Table(this, "notesTable", {
      partitionKey: {
        name: "PK",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    /** DynamoDb features. */

    /**
     * The create note function configuration.
     *
     * The essence of the relationship between the table and the functions:
     * 1. set environment variables containing the name of the table so the lambda (in handler.ts)
     * will be able to know which table to interact with via process.env.TABLE_NAME.
     * 2. grant the Lambda functions the right to interact with the db (rights management is done using IAM policies)
     */
    const createNote = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "createNote",
      {
        entry: path.join(__dirname, "createNote", "handler.ts"),
        handler: "handler",
        environment: {
          TABLE_NAME: notesTable.tableName,
        },
      }
    );

    /**
     * The get note function configuration.
     */
    const getNote = new cdk.aws_lambda_nodejs.NodejsFunction(this, "getNote", {
      entry: path.join(__dirname, "getNote", "handler.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: notesTable.tableName,
      },
    });

    notesTable.grantWriteData(createNote);
    notesTable.grantReadData(getNote);

    /**
     * POST /prod/notes/<user_id>
     * User ID can be anything at this point.
     * 
     * GET /prod/notes/123/2875b0ac-5ee2-4f35-a6dd-406687d5641e
     * returns the created note
     */
    const notesResource = tiahuanacoApi.root
      .addResource("notes")
      .addResource("{userId}");
    notesResource.addMethod(
      "POST",
      new cdk.aws_apigateway.LambdaIntegration(createNote)
    );
    notesResource
      .addResource("{id}")
      .addMethod("GET", new cdk.aws_apigateway.LambdaIntegration(getNote));
  }
}
