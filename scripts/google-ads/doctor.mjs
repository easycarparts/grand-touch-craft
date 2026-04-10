import { getCustomerInfo, loadWorkflowConfig } from "./api.mjs";

try {
  const config = loadWorkflowConfig(process.argv.slice(2));
  const customer = await getCustomerInfo(config);

  if (!customer) {
    throw new Error("Google Ads API connected, but no customer record was returned.");
  }

  console.log("Google Ads API connection looks good.");
  console.log(`Customer ID: ${customer.id}`);
  console.log(`Account name: ${customer.descriptiveName}`);
  console.log(`Currency: ${customer.currencyCode}`);
  console.log(`Timezone: ${customer.timeZone}`);
  console.log(`Manager account: ${customer.manager ? "yes" : "no"}`);
} catch (error) {
  console.error("ads:doctor failed.");
  console.error(error.message);
  process.exitCode = 1;
}
