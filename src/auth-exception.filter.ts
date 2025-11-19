import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AuthException,
  InvalidAlgHeaderException,
  InvalidTypHeaderException,
} from './auth';
import {
  ExpiredTokenException,
  InvalidAudienceException,
  InvalidAuthorizationHeaderException,
  InvalidIssuerException,
  InvalidSignatureException,
} from './auth.guard';

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
    } else if (
      exception instanceof InvalidAudienceException ||
      exception instanceof ExpiredTokenException ||
      exception instanceof InvalidAlgHeaderException ||
      exception instanceof InvalidSignatureException ||
      exception instanceof InvalidIssuerException
    ) {
      response
        .status(401)
        .appendHeader('WWW-Authenticate', [
          'Bearer',
          'realm="amsterdam-mail-service"',
          'error="invalid_token"',
          `error_description="${exception.message}"`,
        ])
        .send('Unauthorized');
    }
  }
}
