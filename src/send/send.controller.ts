import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOAuth2,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CredentialsNotFoundError } from 'src/repositories';
import {
  SendRequestDto,
  SendResponseDto,
  SendResponseDtoFactory,
} from './send.dto';
import { SenderFactory } from './send';

@ApiOAuth2(['send'])
@Controller('send')
export class SendController {
  public constructor(
    private senderFactory: SenderFactory,
    private responseFactory: SendResponseDtoFactory,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiBody({ type: SendRequestDto })
  @ApiResponse({ type: SendResponseDto })
  @ApiBadRequestResponse({
    headers: {
      'www-authenticate': {
        description: 'May contain information on authentication failures',
      },
    },
  })
  @ApiUnauthorizedResponse({
    headers: {
      'www-authenticate': {
        description: 'Contains information on authentication failures',
      },
    },
  })
  public async send(
    @Req() request: Request,
    @Body() sendRequestDto: SendRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SendResponseDto> {
    const sub = request.jwt.claims.sub;
    try {
      const sender = await this.senderFactory.produce(sub);
      await sender.send(
        sendRequestDto.title,
        sendRequestDto.previewText,
        sendRequestDto.bodyText,
        sendRequestDto.from,
        sendRequestDto.to,
        sendRequestDto.subject,
      );
    } catch (error) {
      if (error instanceof CredentialsNotFoundError) {
        response.status(404);

        return this.responseFactory.produce(
          'Credentials not found. Did you add them using the /credentials endpoint?',
        );
      }

      throw error;
    }

    return this.responseFactory.produce('Mail sent successfully!');
  }
}
