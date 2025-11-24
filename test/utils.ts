import type { SecretClient } from "@azure/keyvault-secrets";

export const deleteCredentials = async (client: SecretClient) => {
  try {
    const poller = await client.beginDeleteSecret(
      'ccd03ed4-6873-422f-828b-38a39e358fc9-smtpUser',
    );
    await poller.pollUntilDone();
  } catch (err) {
    console.error(err);
  }
  try {
    const poller = await client.beginDeleteSecret(
      'ccd03ed4-6873-422f-828b-38a39e358fc9-smtpPass',
    );
    await poller.pollUntilDone();
  } catch (err) {
    console.error(err);
  }
};
