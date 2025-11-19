import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Jwt } from '@okta/jwt-verifier';
import type OktaJwtVerifier from '@okta/jwt-verifier';
import type { Request } from 'express';
import { AuthException, type JWTHeaderVerifier } from './auth';

declare module 'express-serve-static-core' {
  interface Request {
    jwt?: Jwt;
  }
}

export class InvalidAuthorizationHeaderException extends AuthException {}
export class TokenException extends AuthException {}
export class InvalidAudienceException extends TokenException {}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private headerVerifier: JWTHeaderVerifier,
    private jwtVerifier: OktaJwtVerifier,
    private expectedAudience: string,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (authorization === undefined || !authorization.startsWith('Bearer ')) {
      throw new InvalidAuthorizationHeaderException(
        'No bearer token provided!',
      );
    }

    const token = authorization.substring(7);

    this.headerVerifier.verify(token);

    try {
      const jwt = await this.jwtVerifier.verifyAccessToken(
        token,
        this.expectedAudience,
      );
      request.jwt = jwt;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('audience claim')
      ) {
        throw new InvalidAudienceException(`Error: ${error.message}`);
      }
      throw new TokenException();
    }

    return true;
  }
}
