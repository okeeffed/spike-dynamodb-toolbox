export enum RolePermission {
  ROLES_ALL = "ROLES.*",
  ROLES_ACTIVITY_FEED = "ROLES.ACTIVITY_FEED",
}

export enum MerchantPermission {
  MERCHANT_ALL_ALL = "MERCHANT_ALL_ALL",
  MERCHANT_ORDER_ALL = "MERCHANT_ORDER_ALL",
}

export type Permission = RolePermission | MerchantPermission;
