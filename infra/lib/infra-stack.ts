import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class MyDynamoDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "spike-dynamodb-toolbox", {
      tableName: "spike-dynamodb-toolbox",
      partitionKey: {
        name: "composite_id",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "sort_key", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // or PROVISIONED
    });

    // Adding a Global Secondary Index for searchable first name
    table.addGlobalSecondaryIndex({
      indexName: "gsi_sorted_roles",
      partitionKey: {
        name: "gsi_pk_1",
        type: dynamodb.AttributeType.STRING,
      },
      // Uncomment the following if you decide to add a sort key for the GSI
      sortKey: {
        name: "_md",
        type: dynamodb.AttributeType.STRING,
      },
    });
  }
}

const app = new cdk.App();
new MyDynamoDBStack(app, "MyDynamoDBStack");
