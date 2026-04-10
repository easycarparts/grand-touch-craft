import { listAccessibleCustomers, loadWorkflowConfig } from "./api.mjs";

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const customers = await listAccessibleCustomers(config);

  if (customers.length === 0) {
    console.log("No accessible Google Ads customers were returned.");
    process.exit(0);
  }

  console.log("Accessible Google Ads customers:");
  for (const resourceName of customers) {
    console.log(`- ${resourceName}`);
  }
} catch (error) {
  console.error("ads:list-customers failed.");
  console.error(error.message);
  process.exitCode = 1;
}
