
# Access errors: AccessDeniedException & Missing Authentication Token

Currently I have two endpoints that work:

```txt
POST /prod/notes/123/
GET /prod/notes/123/2875b0ac-5ee2-4f35-a6dd-406687d5641e
```

And three that don't work from a browser, but work in the AWS Lambda console:

```txt
GET /prod/tiahuanaco
GET /prod/dice/3
GET /prod/notes/123/
```

The first two both return ```"message": "Missing Authentication Token"``` when run in the browser but run fine in the AWS console tests.

I am trying to add a get all notes endpoint (GET /prod/notes/123/) for the homework section on the [Getting started with AWS serverless - Databases](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-databases-kkg) article.

This error I am seeing goes like this: "URL x is not authorized to perform: dynamodb:Query on resource y because no identity-based policy allows the dynamodb:Query action".

It seems like this is the right thing to grant access:

```ts
notesTable.grantReadData(getAllNotes);
```

When deployed, the /prod/notes/123 GET returns this error:

```json
{
    "message": "Internal Server Error",
    "error": {
        "name": "AccessDeniedException",
        "$fault": "client",
        "$metadata": {
            "httpStatusCode": 400,
            "requestId": "0LDG64FPRPRCOTVRUCJUGL88DVVV4KQNSO5AEMVJF66Q9ASUAAJG",
            "attempts": 2,
            "totalRetryDelay": 60
        },
        "__type": "com.amazon.coral.service#AccessDeniedException",
        "message": "User: arn:aws:sts::100641718971:assumed-role/TiahuanacoStack-getAllNotesServiceRole77AEA8E9-BAxabhR232yB/TiahuanacoStack-getAllNotes6540FC17-efgWfi47wvqa is not authorized to perform: dynamodb:Query on resource: arn:aws:dynamodb:us-east-1:100641718971:table/TiahuanacoStack-notesTableAC5177F3-WFSH0ZIDVLOJ because no identity-based policy allows the dynamodb:Query action"
    }
}
```

So then I tried this (though this might be a *slight* security issue):

```ts
notesTable.grantFullAccess(getAllNotes);
```

However, these did not help.  So I asked ChatGPT and it suggested this code:

```ts
   notesTable.grantWriteData(createNote); // works
   notesTable.grantReadData(getNote); // works
   notesTable.grantReadData(getAllNotes);
    
   // Explicitly grant the getAllNotes function permission to query the table
    getAllNotes.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ["dynamodb:Query"],
      resources: [notesTable.tableArn],
    }));
```

I should point out the GET /prod/notes/123/2875b0ac-5ee2-4f35-a6dd-406687d5641e works fine.

I also tried:

```ts
    // Create a custom IAM policy for the getAllNotes Lambda function
    const getAllNotesPolicy = new cdk.aws_iam.Policy(this, "getAllNotesPolicy", {
      statements: [
        new cdk.aws_iam.PolicyStatement({
          actions: ["dynamodb:Query"],
          resources: [notesTable.tableArn],
        }),
      ],
    });

    // Attach the custom policy to the getAllNotes Lambda function
    getAllNotes.role?.attachInlinePolicy(getAllNotesPolicy);
```

And

```js
    // Create a custom IAM policy for the getAllNotes Lambda function
    const getAllNotesPolicy = new cdk.aws_iam.Policy(this, "getAllNotesPolicy", {
      statements: [
        new cdk.aws_iam.PolicyStatement({
          actions: [
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:GetItem",
            "dynamodb:BatchGetItem"
          ],
          resources: [notesTable.tableArn],
        }),
      ],
    });

    // Attach the custom policy to the getAllNotes Lambda function
    getAllNotes.role?.attachInlinePolicy(getAllNotesPolicy);
```

A GET for this URL: https://s19oeuhvf4.execute-api.us-west-2.amazonaws.com/prod/tiahuanaco

Returns this response:

```json
{
    "message": "Missing Authentication Token"
}
```

When I test this API in the AWS Lambda function console, I see this result:

```json
Test Event Name
test

Response
"TiahuanacoStack is live."

Function Logs
START RequestId: 640631f7-1e5a-4847-bfd3-98f731118ecc Version: $LATEST
END RequestId: 640631f7-1e5a-4847-bfd3-98f731118ecc
REPORT RequestId: 640631f7-1e5a-4847-bfd3-98f731118ecc	Duration: 80.51 ms	Billed Duration: 81 ms	Memory Size: 128 MB	Max Memory Used: 68 MB

Request ID
640631f7-1e5a-4847-bfd3-98f731118ecc
```

How do I allow access to this API without returning a Missing Authentication Token error?

ChatGPT suggested this code:

```ts
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path from "path";
import { join } from "path";

export class TiahuanacoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Existing code...

    const tiahuanacoLambda = new cdk.aws_lambda_nodejs.NodejsFunction(this, "tiahuanacoLambda", {
      entry: path.join(__dirname, "tiahuanacoLambda", "handler.ts"),
      handler: "handler",
    });

    const tiahuanacoApi = new cdk.aws_apigateway.RestApi(
      this,
      "tiahuanacoApi",
      {}
    );

    // Add a new resource and method for the tiahuanacoLambda function
    const tiahuanacoResource = tiahuanacoApi.root.addResource("tiahuanaco");
    tiahuanacoResource.addMethod(
      "GET",
      new cdk.aws_apigateway.LambdaIntegration(tiahuanacoLambda),
      {
        authorizationType: cdk.aws_apigateway.AuthorizationType.NONE,
      }
    );

    // Deploy the API to a stage
    const deployment = new cdk.aws_apigateway.Deployment(this, 'Deployment', {
      api: tiahuanacoApi,
    });

    new cdk.aws_apigateway.Stage(this, 'Stage', {
      deployment,
      stageName: 'prod',
    });

    // Existing code...
  }
}
```

But the deployment fails with this message:

```err
Failed resources:
TiahuanacoStack | 3:46:18 am | CREATE_FAILED        | AWS::ApiGateway::Stage      | Stage (Stage0E8C2AF5) s19oeuhvf4|prod already exists in stack arn:aws:cloudformation:us-west-2:100641718971:stack/TiahuanacoStack/0e98bf20-4354-11ef-832c-0630f5eb999b

 ❌  TiahuanacoStack failed: Error: The stack named TiahuanacoStack failed to deploy: UPDATE_ROLLBACK_COMPLETE: s19oeuhvf4|prod already exists in stack arn:aws:cloudformation:us-west-2:100641718971:stack/TiahuanacoStack/0e98bf20-4354-11ef-832c-0630f5eb999b
    at FullCloudFormationDeployment.monitorDeployment (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:455:10568)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.deployStack2 [as deployStack] (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:199716)
    at async C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:181438

 ❌ Deployment failed: Error: The stack named TiahuanacoStack failed to deploy: UPDATE_ROLLBACK_COMPLETE: s19oeuhvf4|prod already exists in stack arn:aws:cloudformation:us-west-2:100641718971:stack/TiahuanacoStack/0e98bf20-4354-11ef-832c-0630f5eb999b
    at FullCloudFormationDeployment.monitorDeployment (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:455:10568)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.deployStack2 [as deployStack] (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:199716)
    at async C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:181438

The stack named TiahuanacoStack failed to deploy: UPDATE_ROLLBACK_COMPLETE: s19oeuhvf4|prod already exists in stack arn:aws:cloudformation:us-west-2:100641718971:stack/TiahuanacoStack/0e98bf20-4354-11ef-832c-0630f5eb999b
```

It also suggested this:

```ts

    const getAllNotesRole = new cdk.aws_iam.Role(this, "getAllNotesRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    getAllNotesRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
        ],
        resources: [notesTable.tableArn],
      })
    );
```

Same error as before: *URL x is not authorized to perform: dynamodb:Query on resource: <table-id> because no identity-based policy allows the dynamodb:Query action"*

ChatGPT is nice and all but sometimes it leads you down the garden path and the solutions get longer and more complicated.  It's at time like this that I remember StackOverflow and it's anwers.

[This answer](https://stackoverflow.com/questions/37498124/accessdeniedexception-user-is-not-authorized-to-perform-lambdainvokefunction) details going to IAM and selecting roles like this:

* Step 1: Go to iam
* Step 2: Create an inline policy and Add the resource name then Click on next , set a name and click on create policy
* Step 3: Validate that the new policy was created

My details shown in the answer are:

```txt
User: arn:aws:sts::123456789:assumed-role/acme-role-fda27de8/acme is not authorized to perform: 
lambda:InvokeFunction on resource:
arn:aws:lambda:us-east-1:123456789:function:acme-function because 
no identity-based policy allows the lambda:InvokeFunction action
```

role: acme-role-fda27de8

resource or your function name: arn:aws:lambda:us-east-1:123456789:function:acme-function

Let me see if I have this right for my error:

```txt
"User: arn:aws:sts::100641718971:assumed-role/TiahuanacoStack-getAllNotesServiceRole77AEA8E9-BAxabhR232yB/TiahuanacoStack-getAllNotes6540FC17-efgWfi47wvqa is not authorized to perform: dynamodb:Query on resource: arn:aws:dynamodb:us-east-1:100641718971:table/TiahuanacoStack-notesTableAC5177F3-WFSH0ZIDVLOJ because no identity-based policy allows the dynamodb:Query action"
```

role: TiahuanacoStack-getAllNotesServiceRole77AEA8E9-BAxabhR232yB

resource: arn:aws:dynamodb:us-east-1:100641718971:table/TiahuanacoStack-notesTableAC5177F3-WFSH0ZIDVLOJ

However, shouldn't these IAM roles be being set automatically?

When I deploy the basic permissions, I see this output:

```txt
├───┼───────────────────┼────────┼────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ + │ ${notesTable.Arn} │ Allow  │ dynamodb:BatchGetItem                                      │ AWS:${getAllNotes/ServiceRole}                              │           │ 
│   │                   │        │ dynamodb:ConditionCheckItem                                │                                                             │           │ 
│   │                   │        │ dynamodb:DescribeTable                                     │                                                             │           │ 
│   │                   │        │ dynamodb:GetItem                                           │                                                             │           │ 
│   │                   │        │ dynamodb:GetRecords                                        │                                                             │           │ 
│   │                   │        │ dynamodb:GetShardIterator                                  │                                                             │           │ 
│   │                   │        │ dynamodb:Query                                             │                                                             │           │ 
│   │                   │        │ dynamodb:Scan                                              │                                                             │           │ 
└───┴───────────────────┴────────┴────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┴───────────┘
```

I see dynamodb:Query on that list.

In my IAM roles table, I see this: TiahuanacoStack-getAllNotesServiceRole77AEA8E9-hWTDnOOaisBz.  Notice that is slightly different.

Anyhow, since the permissions were created in the CDK, I think they need to be handled in the CDK.
