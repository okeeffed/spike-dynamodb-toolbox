import { role } from "./db.js";

async function main() {
  // TODO: Implementation
  const roles = await role.query(`PartyType#Merchant#PartyId#123`, {
    index: "gsi_sorted_roles",
    limit: 10,
  });

  console.log("Roles:", roles);

  // At this point, you would likely unmarshal/transform the data into the expected format for return
}

main().catch(console.error);
