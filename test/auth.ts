import request from "supertest";
import superagent from "superagent";
import { expect } from "vitest";
import type { INestApplication } from "@nestjs/common";
import type { App } from "supertest/types";

export const test_client_id = "test-client";
export const test_client_secret = "t7f4say1ARTe5BJ5N3VFCwqY06jJY7oA";

export const test_no_token_provided = async (
  app: INestApplication<App>,
  url: string,
  requestBody: object,
) => {
  const response = await request(app.getHttpServer()).post(url).send(requestBody);

  expect(response.statusCode).toEqual(400);
  expect(response.headers["www-authenticate"]).toEqual(
    'Bearer, realm="amsterdam-mail-service", error="invalid_request", error_description="No bearer token provided"',
  );
  expect(response.text).toEqual("Bad request");
};

// export const test_invalid_typ_header = async (
//   url: string,
//   requestBody: object,
// ) => {
//   const tokenResponse = await superagent
//     .post(
//       "http://keycloak:8002/realms/amsterdam-mail-service/protocol/openid-connect/token",
//     )
//     .send("client_id=test-client-with-JWT-typ-header")
//     .send("client_secret=S3iPjLlqgGRsRJaF8yByABHBfdvRjkSO")
//     .send("grant_type=client_credentials");

//   const response = await request(app)
//     .post(url)
//     .send(requestBody)
//     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

//   expect(response.statusCode).toEqual(400);
//   expect(response.headers["www-authenticate"]).toEqual(
//     'Bearer, realm="amsterdam-mail-service", error="invalid_request", error_description="The typ header is invalid"',
//   );
//   expect(response.text).toEqual("Bad request");
// };

// export const test_invalid_audience = async (
//   url: string,
//   requestBody: object,
// ) => {
//   const tokenResponse = await superagent
//     .post(
//       "http://keycloak:8002/realms/amsterdam-mail-service/protocol/openid-connect/token",
//     )
//     .send("client_id=test-client-with-incorrect-audience")
//     .send("client_secret=ticz9eg5MOmY4GRmSNwobHTYQWcy7Ll2")
//     .send("grant_type=client_credentials");

//   const response = await request(app)
//     .post(url)
//     .send(requestBody)
//     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

//   expect(response.statusCode).toEqual(401);
//   expect(response.headers["www-authenticate"]).toEqual(
//     'Bearer, realm="amsterdam-mail-service", error="invalid_token", error_description="Error: audience claims test-audience, account do not include expected audience: amsterdam-mail-service"',
//   );
//   expect(response.text).toEqual("Unauthorized");
// };

// export const test_expired_token = async (url: string, requestBody: object) => {
//   const tokenResponse = await superagent
//     .post(
//       "http://keycloak:8002/realms/amsterdam-mail-service/protocol/openid-connect/token",
//     )
//     .send("client_id=test-client-with-very-quickly-expiring-tokens")
//     .send("client_secret=nrtOBWWsoXFvJdxp8uvnc0WZ1gKCh91J")
//     .send("grant_type=client_credentials");

//   const response = await request(app)
//     .post(url)
//     .send(requestBody)
//     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

//   expect(response.statusCode).toEqual(401);
//   expect(response.headers["www-authenticate"]).toEqual(
//     'Bearer, realm="amsterdam-mail-service", error="invalid_token", error_description="JwtParseError: Jwt is expired"',
//   );
//   expect(response.text).toEqual("Unauthorized");
// };

// export const test_invalid_alg_header = async (
//   url: string,
//   test_client_id: string,
//   test_client_secret: string,
//   requestBody: object,
// ) => {
//   const tokenResponse = await getToken();
//   const token: string = tokenResponse.body.access_token;
//   const [header, payload, signature] = token.split(".");

//   const decodedHeader = JSON.parse(
//     Buffer.from(header, "base64").toString("utf-8"),
//   );
//   decodedHeader.alg = "none";

//   const encodedHeader = Buffer.from(JSON.stringify(decodedHeader)).toString(
//     "base64",
//   );
//   const modifiedToken = `${encodedHeader}.${payload}.${signature}`;

//   const response = await request(app)
//     .post(url)
//     .send(requestBody)
//     .set("Authorization", `Bearer ${modifiedToken}`);

//   expect(response.statusCode).toEqual(401);
//   expect(response.headers["www-authenticate"]).toEqual(
//     'Bearer, realm="amsterdam-mail-service", error="invalid_token", error_description="JwtParseError: Unexpected signature algorithm"',
//   );
//   expect(response.text).toEqual("Unauthorized");
// };

// export const test_invalid_signature = async (
//   url: string,
//   test_client_id: string,
//   test_client_secret: string,
//   requestBody: object,
// ) => {
//   const tokenResponse = await getToken();

//   const token: string = tokenResponse.body.access_token;
//   const [header, payload, signature] = token.split(".");

//   const modifiedToken = `${header}.${payload}.${signature.substring(0, signature.length - 5)}TEST`;

//   const response = await request(app)
//     .post(url)
//     .send(requestBody)
//     .set("Authorization", `Bearer ${modifiedToken}`);

//   expect(response.statusCode).toEqual(401);
//   expect(response.headers["www-authenticate"]).toEqual(
//     'Bearer, realm="amsterdam-mail-service", error="invalid_token", error_description="JwtParseError: Signature verification failed"',
//   );
//   expect(response.text).toEqual("Unauthorized");
// };

// export const test_invalid_issuer = async (
//   url: string,
//   test_client_id: string,
//   test_client_secret: string,
//   requestBody: object,
// ) => {
//   const tokenResponse = await superagent
//     .post(
//       "http://iam:8002/realms/amsterdam-mail-service/protocol/openid-connect/token",
//     )
//     .send(`client_id=${test_client_id}`)
//     .send(`client_secret=${test_client_secret}`)
//     .send("grant_type=client_credentials");

//   const response = await request(app)
//     .post(url)
//     .send(requestBody)
//     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

//   expect(response.statusCode).toEqual(401);
//   expect(response.headers["www-authenticate"]).toEqual(
//     'Bearer, realm="amsterdam-mail-service", error="invalid_token", error_description="Error: issuer http://iam:8002/realms/amsterdam-mail-service does not match expected issuer: http://keycloak:8002/realms/amsterdam-mail-service"',
//   );
//   expect(response.text).toEqual("Unauthorized");
// };

export const getToken = async () => {
  return await superagent
    .post(
      "http://keycloak:8002/realms/amsterdam-mail-service/protocol/openid-connect/token",
    )
    .send(`client_id=${test_client_id}`)
    .send(`client_secret=${test_client_secret}`)
    .send("grant_type=client_credentials");
};
