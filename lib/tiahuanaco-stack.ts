import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path from "path";

export class TiahuanacoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * This construct creates a Lambda function using Node.js,
     * taking care of packaging (ie: we won't have to worry about importing dependencies etc...).
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

    const rollADiceFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "rollADiceFunction",
      {
        entry: path.join(__dirname, "rollADice", "handler.ts"),
        handler: "handler",
      }
    );

    diceResource.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(rollADiceFunction)
    );
  }
}
