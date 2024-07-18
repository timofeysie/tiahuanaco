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
    const rollManyDicesFunction = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'rollDicesFunction', {
      entry: join(__dirname, 'rollManyDices', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
    });

    diceResource.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(rollManyDicesFunction)
    );
  }
}
