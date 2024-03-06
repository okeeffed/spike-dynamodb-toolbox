export enum RolePermission {
  ROLES_ALL = "ROLES.*",
  ROLES_ACTIVITY_FEED = "ROLES.ACTIVITY_FEED",
}

export enum MerchantPermission {
  MERCHANT_ALL_ALL = "MERCHANT_ALL_ALL",
  MERCHANT_ORDER_ALL = "MERCHANT_ORDER_ALL",
}

export type Permission = RolePermission | MerchantPermission;

// UTILITY TYPES

/**
 * Makes types more readable for debugging
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Helper to create a partial entity with the primary key and sort key.
 * Given DynamoDB is schemaless, this is a way to create a type from a full entity
 * type declaration where the primary key and sort key are present.
 */
export type PartialEntity<T, U = { pk: string; sk: string }> = Partial<T> & U;
