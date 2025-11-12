import { Controller, HttpCode, Post } from '@nestjs/common';
import { CredentialsUpserter } from './credentials';

@Controller('credentials')
export class CredentialsController {
  public constructor(private upserter: CredentialsUpserter) {}

  @Post()
  @HttpCode(200)
  public async credentials() {
    return 'HELLO';
  }
}
