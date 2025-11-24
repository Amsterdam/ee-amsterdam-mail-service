import type { SecretClient } from '@azure/keyvault-secrets';

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

export interface ValidationResponseBody {
  message: string[];
  error: string;
  statusCode: number;
}

export function assertIsValidationResponseBody(
  obj: any,
): asserts obj is ValidationResponseBody {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    !('message' in obj) ||
    !('error' in obj) ||
    !('statusCode' in obj)
  ) {
    throw new Error('Is not a validation response body!');
  }
}

export interface ValidResponseBody {
  message: string;
}

export function assertIsValidResponseBody(
  obj: any,
): asserts obj is ValidResponseBody {
  if (typeof obj !== 'object' || obj === null || !('message' in obj)) {
    throw new Error('Is not a valid resonse body!');
  }
}
