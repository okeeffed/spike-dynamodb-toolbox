import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { z } from "zod";
import {
  MerchantPermission,
  PartialEntity,
  Permission,
  RolePermission,
} from "./types.js";

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

export interface RoleEntity {
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

type ValidRoleEntity = PartialEntity<
  RoleEntity,
  {
    composite_id: RoleEntity["composite_id"];
    sort_key: RoleEntity["sort_key"];
  }
>;

type ValidDynamoDBSchema<T> = Record<keyof T, z.ZodType<any, any, any>>;

// Here you would add a union type for all the entities in your application
type TableAttributes = keyof RoleEntity;
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
  composite_id: RoleEntity["composite_id"];
  sort_key: RoleEntity["sort_key"];
}

export interface RoleGsi2PrimaryKey {
  gsi_pk_1: RoleEntity["gsi_pk_1"];
  sort_key: RoleEntity["modified"];
}

// Use to enforce tight coupling between our RoleEntity
// and the attributes key.
// We emit the auto-created created and modified keys from the
// attributes object.
type RoleEntityAttributeRecord = Record<
  keyof Omit<RoleEntity, "created" | "modified">,
  Entity["attributes"][string]
>;

export const role = new Entity<
  "Role",
  Omit<RoleEntity, "created" | "modified">,
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

// Add Zod helper for validating the entity. Even though nothing here is
// optional, this should be as specific as we actually expect. For example,
// new entities with empty values would break the application if we validate
// too specifically.
export const RoleSchema = z.object({
  composite_id: z.string(),
  sort_key: z.string(),
  name: z.string(),
  lowercaseName: z.string(),
  permissions: z.array(
    z.nativeEnum(RolePermission).or(z.nativeEnum(MerchantPermission))
  ),
  description: z.string(),
  gsi_pk_1: z.string(),
  created: z.string(),
  modified: z.string(),
} satisfies ValidDynamoDBSchema<ValidRoleEntity>);
export type RoleSchema = z.infer<typeof RoleSchema>;
