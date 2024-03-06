import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { Permission } from "./types.js";

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: true, // true, by default.
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

const client = new DynamoDBClient({
  endpoint: `http://localhost:4566`,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
  region: "us-east-1",
});
const ddbDocClient = DynamoDBDocumentClient.from(client, translateConfig);

export interface DynamoDBRoleEntity {
  composite_id: string;
  sort_key: string;
  name: string;
  lowercaseName: string;
  permissions: Permission[]; // This assumes you have defined these types to represent the structure stored in DynamoDB
  description: string;
  gsi_pk_1: string;
  created: string;
  modified: string;
}

type TableAttributes = keyof DynamoDBRoleEntity;

type ValidIndexes = Record<
  string,
  { partitionKey: TableAttributes; sortKey: TableAttributes }
>;

// Instantiate a table
export const MyTable = new Table({
  // Specify table name (used by DynamoDB)
  name: "spike-dynamodb-toolbox",
  indexes: {
    // Indexes are optional, but make accessing the data in a table more flexible
    gsi_sorted_roles: { partitionKey: "gsi_pk_1", sortKey: "modified" },
  } satisfies ValidIndexes,

  // Define partition and sort keys
  partitionKey: "composite_id" satisfies TableAttributes,
  sortKey: "sort_key" satisfies TableAttributes,

  // Add the DocumentClient
  DocumentClient: ddbDocClient,
});

export interface RolePrimaryKey {
  composite_id: DynamoDBRoleEntity["composite_id"];
  sort_key: DynamoDBRoleEntity["sort_key"];
}

export interface RoleGsi2PrimaryKey {
  gsi_pk_1: DynamoDBRoleEntity["gsi_pk_1"];
  sort_key: DynamoDBRoleEntity["modified"];
}

// Use to enforce tight coupling between our DynamoDBRoleEntity
// and the attributes key.
// We emit the auto-created created and modified keys from the
// attributes object.
type RoleEntityAttributeRecord = Record<
  keyof Omit<DynamoDBRoleEntity, "created" | "modified">,
  Entity["attributes"][string]
>;

export const role = new Entity<
  "Role",
  Omit<DynamoDBRoleEntity, "created" | "modified">,
  RolePrimaryKey,
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
    permissions: { type: "list" }, // Assuming permissions is an array of strings
    description: { type: "string" },
    gsi_pk_1: { type: "string" },
  } satisfies RoleEntityAttributeRecord,

  // Assign it to our table
  table: MyTable,

  // In Typescript, the "as const" statement is needed for type inference
  timestamps: true,
} as const);
