# Tiahuanaco


Running
```
serverless invoke local --function create --path mocks/create-event.json
```

The response should be statusCode: 200, but it's 500.

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
serverless invoke local --function create --path mocks/create-event.json
Serverless: Bundling with Webpack...
Time: 34928ms
...
=============== { AccessDeniedException: User: arn:aws:iam::100641718971:user/serverless-agent is not authorized to perform: dynamodb:PutItem on resource: arn:aws:dynamodb:us-east-1:100641718971:table/notes
    at Request.extractError (/Users/tim/node/aws/notes-app-api/node_modules/aws-sdk/lib/protocol/json.js:51:27)
    ...
  message:
   'User: arn:aws:iam::100641718971:user/serverless-agent is not authorized to perform: dynamodb:PutItem on resource: arn:aws:dynamodb:us-east-1:100641718971:table/notes',
  code: 'AccessDeniedException',
  time: 2019-06-24T12:43:53.489Z,
  requestId: 'BVS7IB1GLPIN2AAQD7BHF04B93VV4KQNSO5AEMVJF66Q9ASUAAJG',
  statusCode: 400,
  retryable: false,
  retryDelay: 14.086041229294445 }
{
    "statusCode": 500,
    "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
    },
    "body": "{\"status\":false}"
}
```

Searching for that error turned up [this answer](https://stackoverflow.com/questions/34784804/aws-dynamodb-issue-user-is-not-authorized-to-perform-dynamodbputitem-on-resou) which says: *Check the IAM/Role policies that you are using. A quick check is to add AmazonDynamoDBFullAccess policy in your role by going to "Permissions" tab in AWS console. If it works after that then it means you need to create a right access policy and attach it to your role.*

The error after adding the AmazonDynamoDBFullAccess role as discussed above changes the error to:
```
ValidationException: One or more parameter values were invalid: Missing the key nonteIdSortKey in the item
```



# Serverless Node.js Starter

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
