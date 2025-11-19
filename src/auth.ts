import type { JwtHeader } from '@okta/jwt-verifier';

interface OidcDiscoveryResponse {
  jwks_uri: string;
}

function assertIsOidcDiscoveryResponse(
  obj: any,
): asserts obj is OidcDiscoveryResponse {
  if (typeof obj !== 'object' || obj === null || !('jwks_uri' in obj)) {
    throw new Error('OIDC Discovery response is not valid!');
  }
}

export class JWKSUriResolver {
  public constructor(private dicoveryUrl: string) {}

  public async resolve(): Promise<string> {
    const response = await fetch(this.dicoveryUrl);
    if (response.status != 200) {
      throw new Error(
        `Unexpected status code received on OIDC discovery: ${response.status}`,
      );
    }

    const body = await response.json();
    assertIsOidcDiscoveryResponse(body);

    return body.jwks_uri;
  }
}

export class AuthException extends Error {}
export class InvalidJwtHeaderException extends AuthException {}
export class MalformedJwtHeaderException extends InvalidJwtHeaderException {}
export class InvalidTypHeaderException extends InvalidJwtHeaderException {}
export class InvalidAlgHeaderException extends InvalidJwtHeaderException {}

export function assertIsJwtHeader(obj: any): asserts obj is JwtHeader {
  if (
    typeof obj !== 'object' ||
    obj === null ||
    !('typ' in obj) ||
    !('alg' in obj)
  ) {
    throw new MalformedJwtHeaderException(
      'Header does not contain `typ` and/or `alg` properties!',
    );
  }
}

export class JWTHeaderVerifier {
  public constructor(
    private allowedAlgorithms: string[],
    private checkTypHeader: boolean = true,
  ) {}

  public verify(token: string): void {
    const [header, ,] = token.split('.');
    if (header === undefined) {
      throw new MalformedJwtHeaderException('Failed to get header from token!');
    }

    const decodedHeader: unknown = JSON.parse(
      Buffer.from(header, 'base64').toString('utf-8'),
    );
    assertIsJwtHeader(decodedHeader);

    if (this.checkTypHeader) {
      if (
        decodedHeader.typ != 'at+jwt' &&
        decodedHeader.typ != 'application/at+jwt'
      ) {
        throw new InvalidTypHeaderException(
          `Invalid typ header: ${decodedHeader.typ}`,
        );
      }
    }

    if (!this.allowedAlgorithms.includes(decodedHeader.alg)) {
      throw new InvalidAlgHeaderException(
        `Alg not supported: ${decodedHeader.alg}!`,
      );
    }
  }
}
