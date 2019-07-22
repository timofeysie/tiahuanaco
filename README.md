# Tiahuanaco

This project is a Serverless backend to manage content uploaded to AWS.  The front end is [Acapana](https://github.com/timofeysie/acapana).

#
## Table of cotents

* [Workflow](#workflow)
* [Starting out](#starting-out)
* [Serverlss Node.js Starter Docs](#serverless-Node.js-Starter-docs)


## Workflow

Running locally:
```
serverless invoke local --function create --path mocks/create-event.json
```

The response should be statusCode: 200.


## Starting out

The response to running locally should be statusCode: 200, but it's 500.

Console log says:
```
[uuid] external "uuid" 42 bytes {create} [built]
{ UnrecognizedClientException: The security token included in the request is invalid.
    at Request.extractError (/Users/tim/node/aws/notes-app-api/node_modules/aws-sdk/lib/protocol/json.js:51:27)
```

The SO approved approach [here](https://stackoverflow.com/questions/34582318/how-can-i-resolve-the-error-the-security-token-included-in-the-request-is-inval) when followed runs into this issue: *As a best practice, we recommend creating an IAM user that has access keys rather than relying on root access keys.*

I think we have our test user.  But when doing a serverless deploy, we get still get this error:
```
The security token included in the request is invalid
```

One answer on SO says: *It wasn't working because I had a set of credentials configured in ~/.aws and for whatever reason it started interfering with CodeDeploy, even if this configuration has been in place for over 2 years and it worked just fine.*

We have no .aws directory.

Another SO answer: *I created an IAM policy to allow all actions of AWS CloudFormation and attached that policy to the user, and the problem was resolved.*

And another: *The session tokens given out by aws-vault are not usable for some actions like creating roles. Instead, aws-vault exec -n profile ... should be used to use the root profile (not session).*

Or this: *you must not have permission to read IAM, even your own.*

When running the app locally, there error is different.
```
{ AccessDeniedException: User: arn:aws:iam::100641718971:user/serverless-agent is not authorized to perform: dynamodb:PutItem on resource: arn:aws:dynamodb:us-east-1:100641718971:table/notes
```

Searching for that error turned up [this answer](https://stackoverflow.com/questions/34784804/aws-dynamodb-issue-user-is-not-authorized-to-perform-dynamodbputitem-on-resou) which says: *Check the IAM/Role policies that you are using. A quick check is to add AmazonDynamoDBFullAccess policy in your role by going to "Permissions" tab in AWS console. If it works after that then it means you need to create a right access policy and attach it to your role.*

The error after adding the AmazonDynamoDBFullAccess role as discussed above changes the error to:
```
ValidationException: One or more parameter values were invalid: Missing the key nonteIdSortKey in the item
```

According to this Atom editor's global search with ctl-F, there is nononteIdSortKey string in this project.  So it's a DynamoDB thing?

SO answers indicate it is a naming difference such as between Id and ID.  We should check the table and field names?

Here is the function in create.js:
```
export async function main(event, context) {
  const data = JSON.parse(event.body);
  const params = {
    TableName: "notes",
    Item: {
      userId: event.requestContext.identity.cognitoIdentityId,
      noteId: uuid.v1(),
      content: data.content,
      attachment: data.attachment,
      createdAt: Date.now()
  }};
  try {
    await dynamoDbLib.call("put", params);
    return success(params.Item);
  } catch (e) { ... }
}
```

We are looking for a typo.
nonteIdSortKey should be noteIdSortKey?  Or nonoteIdSortKey?  The error itself looks like a type, such that it should say "no noteIdeSortKey".  Anyhow, time to check the DynamoDB dashboard and find out where we mixed up the letters for note.

Yep, nonteIdSortKey is used as the primary sort key.  That's unfortunate.

As the simplest path forward, can change noteId to the misspelled one and see it it works.

Next, when trying to post the form, we are getting a 400 network error:
```
x-amzn-errormessage: 1 validation error detected: Value 'admin@example.com' at 'identityPoolId' failed to satisfy constraint: Member must satisfy regular expression pattern: [\w-]+:[0-9a-f-]+
```
In the request payload:
```
IdentityPoolId: "admin@example.com"
Logins: {,…}
cognito-idp.us-east-1.amazonaws.com/us-east-1_y3LHvvlPG: "eyJ ... 0g"
```

SO: *remove 'arn:aws:kinesis:us-west-2:xxxxxxxxxx:stream/rds-temp-leads-stream' this from stream name. Just put the name of stream there like "rds-temp-leads-stream"*

The preamble, *arn:aws:* was in our first error message above....

Another SO: *I was using user pool id instead of identity pool id.*

[Here](https://serverless-stack.com/chapters/create-a-cognito-user-pool.html) we created a Cognito User Pool.  We can see in our dashboard:
```
Pool Id us-east-1_y3LHvvlPG
Pool ARN arn:aws:cognito-idp:us-east-1:100641718971:userpool/...
```

So actually I think this is a front end issue now.  Or an AWS configuration issue.  Front end, back end, whos responsibity is it?  Since there is only one developer on this project right now, it's just a matter of where to create notes about the project?  Jumping back and forth between client and server project readme files is not working out very well in this case.

Going back to [where the create note API was created](https://serverless-stack.com/chapters/add-a-create-note-api.html), there is a mock that can be run to test it.
```
{
  "body": "{\"content\":\"hello world\",\"attachment\":\"hello.jpg\"}",
  "requestContext": {
    "identity": {
      "cognitoIdentityId": "USER-SUB-1234"
    }
  }
}
```

About this is says *the cognitoIdentityId field is just a string we are going to use as our userId.  We can use any string here; just make sure to use the same one when we test our other functions.*.  That's interesting as when we run the test command we get an error about the userId:
```
$ serverless invoke local --function create --path mocks/create-event.json
[uuid] external "uuid" 42 bytes {create} [built]
=============== { ValidationException: One or more parameter values were invalid: Missing the key noteId in the item
```

The response is *supposed* to look something like this:
```
{ statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  },
  body: '{"userId":"USER-SUB-1234","noteId":"578eb840-f70f-11e6-9d1a-1359b3b22944","content":"hello world","attachment":"hello.jpg","createdAt":1487800950620}'
}
```


Regarding the noteId, in the Acapana project readme file we find this: *I changed noteId to the misspelled one and now that part works, but there is a new error.*

The first error there was:
*ValidationException: One or more parameter values were invalid: Missing the key nonteIdSortKey in the item*

The problem there was that nonteIdSortKey was set as the primary key in the AWS dashbaord.  We would have to create a new table to correct that, so that's why we changed the app not the table.

So, instead of doing the wise thing and dropping the table and creating a new one, I tried this foolishness to see if it would work:
```
noteId: id,
nonteIdSortKey: id,
```


Hahahah.  Yes, and it works.  Well, at least the test passes.  Adding a new note from the React app returns:
```
Request URL: https://cognito-identity.us-east-1.amazonaws.com/
Request Method: POST
Status Code: 400
```

The response:
```
{"__type":"ValidationException","message":"2 validation errors detected: Value 'arn:aws:cognito-idp:us-east-1:100641718971:userpool/us-east-1_y3LHvvlPG' at 'identityPoolId' failed to satisfy constraint: Member must satisfy regular expression pattern: [\\w-]+:[0-9a-f-]+; Value 'arn:aws:cognito-idp:us-east-1:100641718971:userpool/us-east-1_y3LHvvlPG' at 'identityPoolId' failed to satisfy constraint: Member must have length less than or equal to 55"}
```

Who's good at regexes?  
```
[\\w-]+:[0-9a-f-]+
```

That looks like matching \w- and numbers and letters.  Doesn't really help.  For whatever reasons, what we have for the identityPoolId is wrong.

Not sure if we ever created an identity pool.  The confusion between that and a user pool.

This is what the article linked to above says:
*The userId is a Federated Identity id that comes in as a part of the request. This is set after our user has been authenticated via the User Pool. We are going to expand more on this in the coming chapters when we set up our Cognito Identity Pool. However, if you want to use the user’s User Pool user Id; take a look at the Mapping Cognito Identity Id and User Pool Id chapter.*


YOUR_S3_UPLOADS_BUCKET_NAME
YOUR_API_GATEWAY_REGION
YOUR_API_GATEWAY_ID from the deploying the API chapter.

Identity pool ID  us-west-2:f49f44c0-cd15-4c37-9023-414a2c80962b
Identity Pool ARN
arn:aws:cognito-identity:us-west-2:100641718971:identitypool/us-west-2:f49f44c0-cd15-4c37-9023-414a2c80962b

But with these credentials, we get the following error:
```
{"__type":"ResourceNotFoundException","message":"IdentityPool 'us-west-2:f49f44c
```

You can see the id there.  And it's wrong.  How to find it, SO?
```
aws cognito-identity list-identity-pools --max-results 10
```

But that returns an error:
```
An error occurred (AccessDeniedException) when calling the ListIdentityPools operation: User: arn:aws:iam::100641718971:user/serverless-agent is not authorized to perform: cognito-identity:ListIdentityPools on resource: arn:aws:cognito-identity:us-east-1:100641718971:identitypool/
```

Creating a new pool and use that id:
```
{"__type":"ResourceNotFoundException","message":"IdentityPool 'us-west-2:f49f44c0-cd15-4c37-9023-414a2c80962b' not found."}
```

Similar to last time.  Why is it us-west-2?  Fix that at now this:
```
{"__type":"InvalidIdentityPoolConfigurationException","message":"Invalid identity pool configuration. Check assigned IAM roles for this pool."}
```

*create a federated Cognito Identity Pool. We will be using our User Pool as the identity provider. We could also use Facebook, Google, or our own custom identity provider. Once a user is authenticated via our User Pool, the Identity Pool will attach an IAM Role to the user. We will define a policy for this IAM Role to grant access to the S3 bucket and our API. This is the Amazon way of securing your resources.*

Here is the important part of the policy created with the names to the info that needs to be filled is:
```
      "Resource": [
        "arn:aws:s3:::YOUR_S3_UPLOADS_BUCKET_NAME/private/${cognito-identity.amazonaws.com:sub}/*"
      "Resource": [
        "arn:aws:execute-api:YOUR_API_GATEWAY_REGION:*:YOUR_API_GATEWAY_ID/*/*/*"
```



# Serverless Node.js Starter Docs

A Serverless starter that adds ES7 syntax, serverless-offline, environment variables, and unit test support. Part of the [Serverless Stack](http://serverless-stack.com) guide.

[Serverless Node.js Starter](https://github.com/AnomalyInnovations/serverless-nodejs-starter) uses the [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack) plugin, [Babel](https://babeljs.io), [serverless-offline](https://github.com/dherault/serverless-offline), and [Jest](https://facebook.github.io/jest/). It supports:

- **ES7 syntax in your handler functions**
  - Use `import` and `export`
- **Package your functions using Webpack**
- **Run API Gateway locally**
  - Use `serverless offline start`
- **Support for unit tests**
  - Run `npm test` to run your tests
- **Sourcemaps for proper error messages**
  - Error message show the correct line numbers
  - Works in production with CloudWatch
- **Automatic support for multiple handler files**
  - No need to add a new entry to your `webpack.config.js`
- **Add environment variables for your stages**

---

### Demo

A demo version of this service is hosted on AWS - [`https://z6pv80ao4l.execute-api.us-east-1.amazonaws.com/dev/hello`](https://z6pv80ao4l.execute-api.us-east-1.amazonaws.com/dev/hello)

And here is the ES7 source behind it

``` javascript
export const hello = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Go Serverless v1.0! ${(await message({ time: 1, copy: 'Your function executed successfully!'}))}`,
      input: event,
    }),
  };
};

const message = ({ time, ...rest }) => new Promise((resolve, reject) =>
  setTimeout(() => {
    resolve(`${rest.copy} (with a delay)`);
  }, time * 1000)
);
```

### Requirements

- [Install the Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/installation/)
- [Configure your AWS CLI](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

### Installation

To create a new Serverless project.

``` bash
$ serverless install --url https://github.com/AnomalyInnovations/serverless-nodejs-starter --name my-project
```

Enter the new directory

``` bash
$ cd my-project
```

Install the Node.js packages

``` bash
$ npm install
```

### Usage

To run unit tests on your local

``` bash
$ npm test
```

To run a function on your local

``` bash
$ serverless invoke local --function hello
```

To simulate API Gateway locally using [serverless-offline](https://github.com/dherault/serverless-offline)

``` bash
$ serverless offline start
```

Run your tests

``` bash
$ npm test
```

We use Jest to run our tests. You can read more about setting up your tests [here](https://facebook.github.io/jest/docs/en/getting-started.html#content).

Deploy your project

``` bash
$ serverless deploy
```

Deploy a single function

``` bash
$ serverless deploy function --function hello
```

To add another function as a new file to your project, simply add the new file and add the reference to `serverless.yml`. The `webpack.config.js` automatically handles functions in different files.

To add environment variables to your project

1. Rename `env.example` to `env.yml`.
2. Add environment variables for the various stages to `env.yml`.
3. Uncomment `environment: ${file(env.yml):${self:provider.stage}}` in the `serverless.yml`.
4. Make sure to not commit your `env.yml`.

### Support

- Send us an [email](mailto:contact@anoma.ly) if you have any questions
- Open a [new issue](https://github.com/AnomalyInnovations/serverless-nodejs-starter/issues/new) if you've found a bug or have some suggestions.
- Or submit a pull request!

### Maintainers

Serverless Node.js Starter is maintained by Frank Wang ([@fanjiewang](https://twitter.com/fanjiewang)) & Jay V ([@jayair](https://twitter.com/jayair)). [**Subscribe to our newsletter**](http://eepurl.com/cEaBlf) for updates. Send us an [email](mailto:contact@anoma.ly) if you have any questions.
