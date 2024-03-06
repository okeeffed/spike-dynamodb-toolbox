import { faker } from "@faker-js/faker";
import { role, MyTable } from "./db.js";
import { MerchantPermission, RolePermission } from "./types.js";

const NUM_ROLES = 1000;

/**
 * Seed users with random data.
 */
async function seedRoles() {
  let items = [];

  for (let i = 0; i < NUM_ROLES; i++) {
    const name = faker.string.alphanumeric(10);

    items.push(
      role.putBatch({
        composite_id: `Role#${faker.string.uuid()}`,
        sort_key: `PartyType#Merchant#PartyId#123`,
        gsi_pk_1: `PartyType#Merchant#PartyId#123`,
        description: faker.string.alphanumeric(10),
        name: name,
        lowercaseName: name.toLowerCase(),
        permissions: [
          MerchantPermission.MERCHANT_ALL_ALL,
          RolePermission.ROLES_ACTIVITY_FEED,
        ],
      })
    );

    await MyTable.batchWrite(items);
  }
}

async function seedData() {
  console.log("Seeding roles");
  await seedRoles();

  console.log("Seeding completed.");
}

seedData().catch(console.error);
