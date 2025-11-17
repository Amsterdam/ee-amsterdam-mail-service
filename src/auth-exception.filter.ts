import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from 'express';
import { InvalidAuthorizationHeaderException } from "./auth.guard";

@Catch(InvalidAuthorizationHeaderException)
export class InvalidAuthorizationHeaderExceptionFilter implements ExceptionFilter {
  catch(exception: InvalidAuthorizationHeaderException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    response
      .status(400)
      .appendHeader("WWW-Authenticate", [
        "Bearer",
        'realm="amsterdam-mail-service"',
        'error="invalid_request"',
        'error_description="No bearer token provided"',
      ])
      .send('Bad request');
  }
}
