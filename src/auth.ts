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
