import type CredentialsRepository from 'src/repositories';

export class CredentialsUpserter {
  public constructor(private readonly repository: CredentialsRepository) {}

  public upsert(
    sub: string,
    username: string,
    password: string,
  ): Promise<void> {
    return this.repository.upsertCredentials(sub, username, password);
  }
}
