import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CredentialsUpserter } from './credentials';
import {
  CredentialsRequestDto,
  CredentialsResponseDto,
  CredentialsResponseDtoFactory,
} from './credentials.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';

@Controller('credentials')
export class CredentialsController {
  public constructor(
    private upserter: CredentialsUpserter,
    private responseDtoFactory: CredentialsResponseDtoFactory,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiBody({ type: CredentialsRequestDto })
  @ApiResponse({ type: CredentialsResponseDto })
  public async credentials(
    @Body() credentialsRequestDto: CredentialsRequestDto,
  ): Promise<CredentialsResponseDto> {
    await this.upserter.upsert(
      'abc', // TODO: Get this value from access token
      credentialsRequestDto.username,
      credentialsRequestDto.password,
    );

    return this.responseDtoFactory.produce(
      'SMTP credentials successfully stored in keyvault!',
    );
  }
}
