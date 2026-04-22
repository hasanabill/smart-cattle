import { connectToDatabase } from "@/lib/db";
import { seedSampleData } from "@/lib/seed/sample-data";

async function main() {
  await connectToDatabase();
  await seedSampleData();
  console.log("Seed completed successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
