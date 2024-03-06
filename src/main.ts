import { role, RoleSchema } from "./db.js";
import { z } from "zod";

async function main() {
  // TODO: Implementation
  const roles = await role.query(`PartyType#Merchant#PartyId#123`, {
    index: "gsi_sorted_roles",
    limit: 10,
  });

  const validRoles = await z.array(RoleSchema).safeParseAsync(roles.Items);

  console.log("Validated:", validRoles.success);
  console.log(
    "Valid roles:",
    validRoles.success ? validRoles.data : "Invalid roles"
  );
}

main().catch(console.error);
