import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { CredentialsUpserter } from './credentials';
import {
  CredentialsRequestDto,
  CredentialsResponseDto,
  CredentialsResponseDtoFactory,
} from './credentials.dto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

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
    @Req() request: Request,
    @Body() credentialsRequestDto: CredentialsRequestDto,
  ): Promise<CredentialsResponseDto> {
    await this.upserter.upsert(
      request.jwt.claims.sub,
      credentialsRequestDto.username,
      credentialsRequestDto.password,
    );

    return this.responseDtoFactory.produce(
      'SMTP credentials successfully stored in keyvault!',
    );
  }
}
