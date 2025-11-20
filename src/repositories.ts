import { SecretClient } from '@azure/keyvault-secrets';
import { RestError } from '@azure/core-rest-pipeline';

export class CredentialsNotFoundError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'CredentialsNotFoundError';
  }
}

interface Credentials {
  smtpUsername: string;
  smtpPassword: string;
}

export default class CredentialsRepository {
  public constructor(private readonly client: SecretClient) {}

  public async getCredentialsBySub(sub: string): Promise<Credentials> {
    try {
      const userResponse = await this.client.getSecret(`${sub}-smtpUser`);
      const passResponse = await this.client.getSecret(`${sub}-smtpPass`);

      if (userResponse.value == null || passResponse.value == null) {
        throw new CredentialsNotFoundError(
          'Failed to retrieve smtp user and password from keyvault!',
        );
      }

      return {
        smtpUsername: userResponse.value,
        smtpPassword: passResponse.value,
      };
    } catch (error) {
      if (error instanceof RestError && error.statusCode == 404) {
        throw new CredentialsNotFoundError(
          'Failed to retrieve smtp user and/or password from keyvault!',
        );
      }
      throw error;
    }
  }

  public async upsertCredentials(
    sub: string,
    username: string,
    password: string,
  ): Promise<void> {
    await this.client.setSecret(`${sub}-smtpUser`, username);
    await this.client.setSecret(`${sub}-smtpPass`, password);
  }
}
