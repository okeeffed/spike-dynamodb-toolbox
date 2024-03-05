import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import data from "./parties.json";
import { Table, Entity } from "dynamodb-toolbox";

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // if not false explicitly, we set it to true.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: false, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  // NOTE: this is required to be true in order to use the bigint data type.
  wrapNumbers: false, // false, by default.
};

const translateConfig = { marshallOptions, unmarshallOptions };

// const SEARCH_PARTIES_LIMIT = data.parties.length;
const SEARCH_PARTIES_LIMIT = 2;
const PAGE_SIZE = 10;
const PAGE_NUMBER = 1;

const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  region: "us-east-1",
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Instantiate a table
const MyTable = new Table({
  // Specify table name (used by DynamoDB)
  name: "spike-dynamodb-toolbox",
  indexes: {
    // Indexes are optional, but make accessing the data in a table more flexible
    GSI1: { partitionKey: "gsi1_pk", sortKey: "updated_at" },
  },

  // Define partition and sort keys
  partitionKey: "composite_id",
  sortKey: "sort_key",

  // Add the DocumentClient
  DocumentClient: ddbDocClient,
});

interface DynamoDBRoleEntity {
  composite_id: string;
  sort_key: string;
  name: string;
  lowercaseName: string;
  permissions: string[]; // This assumes you have defined these types to represent the structure stored in DynamoDB
  description: string;
  gsi_pk_1: string;
  gsi_pk_2?: string;
  created_at?: string;
  updated_at?: string;
}

interface CustomCompositeKey {
  composite_id: DynamoDBRoleEntity["composite_id"];
  sorsort_keyKey: DynamoDBRoleEntity["sort_key"];
}

const role = new Entity<
  "Role",
  DynamoDBRoleEntity,
  CustomCompositeKey,
  typeof MyTable
>({
  // Specify entity name
  name: "Role",

  // Define attributes
  attributes: {
    composite_id: { partitionKey: true, type: "string" },
    sort_key: { sortKey: true, type: "string" },
    name: { type: "string" },
    lowercaseName: { type: "string" },
    permissions: { type: "list", setType: "string" }, // Assuming permissions is an array of strings
    description: { type: "string" },
    gsi_pk_1: { type: "string" },
    gsi_pk_2: { type: "string", required: false }, // Optional attribute
    // created_at: { type: "string", required: false }, // Optional attribute
    // updated_at: { type: "string", required: false }, // Optional attribute
  },

  // Assign it to our table
  table: MyTable,

  // In Typescript, the "as const" statement is needed for type inference
  timestamps: true,
} as const);

const rsult = await role.put(
  {
    composite_id: "role#1",
    sort_key: "role#1",
    name: "Admin",
    lowercaseName: "admin",
    permissions: ["create", "read", "update", "delete"],
    description: "Admin role",
    gsi_pk_1: "role",
  },
  {
    returnValues: "ALL_OLD",
  }
);

async function queryPartyRoles(partyKey: string, attempt: number = 0) {
  const params = {
    TableName: "spike-dynamodb-toolbox",
    IndexName: "gsi_2", // Assuming GSI1PK is the partition key for the GSI
    KeyConditionExpression: "gsi_pk_2 = :pk",
    ExpressionAttributeValues: {
      ":pk": partyKey,
    },
  };

  try {
    // Using the QueryCommand with the new client
    const command = new QueryCommand(params);
    const result = await ddbDocClient.send(command);
    return result;
  } catch (error) {
    if (attempt < 3) {
      // Retry up to 3 times
      console.log(`Retrying ${partyKey}, attempt ${attempt + 1}`);
      return queryPartyRoles(partyKey, attempt + 1);
    } else {
      throw new Error(
        `Failed to query ${partyKey} after several attempts: ${error}`
      );
    }
  }
}

async function executeBatch(partyKeys: string[]) {
  const promises = partyKeys.map((key) => queryPartyRoles(key));
  return Promise.all(promises);
}

async function batchProcess(
  partyKeys: string[],
  limit: number,
  batchSize: number = 10
) {
  const batchedResults = [];
  for (let i = 0; i < partyKeys.length; i += batchSize) {
    let batchNumber = i / batchSize + 1;
    console.log("Running batch nunber:", batchNumber);
    const batch = partyKeys.slice(i, i + batchSize);
    const results = await executeBatch(batch);
    batchedResults.push(
      ...results.flatMap((item) => item.Items).filter(Boolean)
    );

    if (batchedResults.length >= limit) {
      break;
    }
  }
  return batchedResults;
}

async function main() {
  const partyKeys = data.parties.slice(0, SEARCH_PARTIES_LIMIT);

  console.log("@ Party keys:", partyKeys);
  const batchedRoles = await batchProcess(partyKeys, PAGE_SIZE, 10); // Process in batches of 10
  const pageSize = PAGE_SIZE; // Default pageSize to 10 if not provided
  const pageNumber = PAGE_NUMBER; // Default pageNumber to 1 if not provided

  // Sort the flattened array by the `updated_at` attribute
  const sortedRoles = batchedRoles.sort((a, b) => {
    // @ts-expect-error: ignored for spike
    const dateA = new Date(a.updated_at);
    // @ts-expect-error: ignored for spike
    const dateB = new Date(b.updated_at);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate start index for slicing
  const startIndex = (pageNumber - 1) * pageSize;
  // Slice the sorted array for pagination
  const paginatedRoles = sortedRoles.slice(startIndex, startIndex + pageSize);

  console.log("@ Sorted roles (last 5):", sortedRoles.slice(-5));
  console.log("@ Paginated roles:", paginatedRoles.slice(0, 5));

  console.log("@ sorted roles length", sortedRoles.length);
  console.log("@ paginated roles length", paginatedRoles.length);
}

main().catch(console.error);
