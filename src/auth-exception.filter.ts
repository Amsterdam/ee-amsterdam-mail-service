import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthException, InvalidTypHeaderException } from './auth';
import { InvalidAuthorizationHeaderException } from './auth.guard';

@Catch(AuthException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    if (exception instanceof InvalidAuthorizationHeaderException) {
      response
        .status(400)
        .appendHeader('WWW-Authenticate', [
          'Bearer',
          'realm="amsterdam-mail-service"',
          'error="invalid_request"',
          'error_description="No bearer token provided"',
        ])
        .send('Bad request');
    } else if (exception instanceof InvalidTypHeaderException) {
      response
        .status(400)
        .appendHeader('WWW-Authenticate', [
          'Bearer',
          'realm="amsterdam-mail-service"',
          'error="invalid_request"',
          'error_description="The typ header is invalid"',
        ])
        .send('Bad request');
    }
  }
}
