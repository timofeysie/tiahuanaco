# Errors

## An ancestor of this resource has the same variable name as this one

I have forgotten the context of this one, but it was seen while attempting to fix the AccessDeniedException issue.

```sh
TiahuanacoStack | 6:05:09 pm | CREATE_FAILED        | AWS::ApiGateway::Resource   | tiahuanacoApi/Default/notes/{userId}/{userId} (tiahuanacoApinotesuserId97FA3D55) Resource handler returned message: "An ancestor of this resource has the same variable name as this one: {userId} (Service: ApiGateway, Status Code: 400, Request ID: 3bd382fe-daf0-4866-bf3f-c49fd1690156)" (RequestToken: 391b54b7-89e8-24fc-9ddd-7a6c520432e7, HandlerErrorCode: InvalidRequest)

 ❌  TiahuanacoStack failed: Error: The stack named TiahuanacoStack failed to deploy: UPDATE_ROLLBACK_COMPLETE: Resource handler returned message: "An ancestor of this resource has the same variable name as this one: {userId} (Service: ApiGateway, Status Code: 400, Request ID: 3bd382fe-daf0-4866-bf3f-c49fd1690156)" (RequestToken: 391b54b7-89e8-24fc-9ddd-7a6c520432e7, HandlerErrorCode: InvalidRequest)
    at FullCloudFormationDeployment.monitorDeployment (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:455:10568)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.deployStack2 [as deployStack] (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:199716)
    at async C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:181438

 ❌ Deployment failed: Error: The stack named TiahuanacoStack failed to deploy: UPDATE_ROLLBACK_COMPLETE: Resource handler returned message: "An ancestor of this resource has the same variable name as this one: {userId} (Service: ApiGateway, Status Code: 400, Request ID: 3bd382fe-daf0-4866-bf3f-c49fd1690156)" (RequestToken: 391b54b7-89e8-24fc-9ddd-7a6c520432e7, HandlerErrorCode: InvalidRequest)
    at FullCloudFormationDeployment.monitorDeployment (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:455:10568)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.deployStack2 [as deployStack] (C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:199716)
    at async C:\Users\timof\repos\typescript\tiahuanaco\node_modules\aws-cdk\lib\index.js:458:181438

The stack named TiahuanacoStack failed to deploy: UPDATE_ROLLBACK_COMPLETE: Resource handler returned message: "An ancestor of this resource has the same variable name as this one: {userId} (Service: ApiGateway, Status Code: 400, Request ID: 3bd382fe-daf0-4866-bf3f-c49fd1690156)" (RequestToken: 391b54b7-89e8-24fc-9ddd-7a6c520432e7, HandlerErrorCode: InvalidRequest)
```
