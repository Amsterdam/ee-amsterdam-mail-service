import request from 'supertest';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import type { App } from 'supertest/types';
import {
  assertIsTokenResponseBody,
  getToken,
  test_expired_token,
  test_header_missing_alg,
  test_header_missing_alg_and_typ,
  test_header_missing_typ,
  test_invalid_alg_header,
  test_invalid_audience,
  test_invalid_issuer,
  test_invalid_signature,
  test_invalid_typ_header,
  test_no_token_provided,
} from 'test/auth';
import { beforeEach, describe, expect, it } from 'vitest';
import { SecretClient } from '@azure/keyvault-secrets';
import { assertIsValidationResponseBody, deleteCredentials } from 'test/utils';

const requestBody = {
  username: 'test_smtp_user',
  password: 'smtp_secret',
};
const url = '/credentials';

interface ValidResponseBody {
  message: string;
}

function assertIsValidResponseBody(obj: any): asserts obj is ValidResponseBody {
  if (typeof obj !== 'object' || obj === null || !('message' in obj)) {
    throw new Error('Is not a valid resonse body!');
  }
}

describe('CredentialsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('It should store credentials with a valid token', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send(requestBody)
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(200);

    const responseBody: unknown = response.body;
    assertIsValidResponseBody(responseBody);

    expect(responseBody).toHaveProperty('message');
    expect(responseBody.message).toEqual(
      'SMTP credentials successfully stored in keyvault!',
    );

    const client = app.get(SecretClient);
    const smtpUserResponse = await client.getSecret(
      'ccd03ed4-6873-422f-828b-38a39e358fc9-smtpUser',
    );

    expect(smtpUserResponse.value).toEqual(requestBody.username);

    const smtpPassResponse = await client.getSecret(
      'ccd03ed4-6873-422f-828b-38a39e358fc9-smtpPass',
    );

    expect(smtpPassResponse.value).toEqual(requestBody.password);

    await deleteCredentials(client);
  });

  it('It should not store credentials with no token provided', async () => {
    await test_no_token_provided(app, url, requestBody);
  });

  it('It should not store credentials with typ missing from header', async () => {
    await test_header_missing_typ(app, url, requestBody);
  });

  it('It should not store credentials with alg missing from header', async () => {
    await test_header_missing_alg(app, url, requestBody);
  });

  it('It should not store credentials with alg and typ missing from header', async () => {
    await test_header_missing_alg_and_typ(app, url, requestBody);
  });

  it('It should not store credentials with a invalid typ header in the access token', async () => {
    await test_invalid_typ_header(app, url, requestBody);
  });

  it('It should not store credentials with an invalid audience in the access token', async () => {
    await test_invalid_audience(app, url, requestBody);
  });

  it('It should not store credentials with an expired access token', async () => {
    await test_expired_token(app, url, requestBody);
  });

  it('It should not store credentials with a invalid alg header in the access token', async () => {
    await test_invalid_alg_header(app, url, requestBody);
  });

  it('It should not store credentials with a invalid signature in the access token', async () => {
    await test_invalid_signature(app, url, requestBody);
  });

  it('It should not store credentials with a invalid issuer in the access token', async () => {
    await test_invalid_issuer(app, url, requestBody);
  });

  it('It should not store credentials with username missing', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        password: 'password',
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(response).toHaveProperty('body');
    expect(validationResponseBody).toBeTypeOf('object');
    expect(validationResponseBody).toHaveProperty('message');
    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[0]).toEqual(
      'username must be longer than or equal to 2 characters',
    );
    expect(validationResponseBody.message[1]).toEqual(
      'username must be a string',
    );
    expect(validationResponseBody).toHaveProperty('error');
    expect(validationResponseBody.error).toEqual('Bad Request');
    expect(validationResponseBody).toHaveProperty('statusCode');
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it('It should not store credentials with username too short', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        username: 'a',
        password: 'password',
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody).toHaveProperty('message');
    expect(validationResponseBody.message).toHaveLength(1);
    expect(validationResponseBody.message[0]).toEqual(
      'username must be longer than or equal to 2 characters',
    );
    expect(validationResponseBody).toHaveProperty('error');
    expect(validationResponseBody.error).toEqual('Bad Request');
    expect(validationResponseBody).toHaveProperty('statusCode');
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it('It should not store credentials with username wrong type', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        username: false,
        password: 'password',
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody).toHaveProperty('message');
    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[0]).toEqual(
      'username must be longer than or equal to 2 characters',
    );
    expect(validationResponseBody.message[1]).toEqual(
      'username must be a string',
    );
    expect(validationResponseBody).toHaveProperty('error');
    expect(validationResponseBody.error).toEqual('Bad Request');
    expect(validationResponseBody).toHaveProperty('statusCode');
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it('It should not store credentials with password missing', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        username: 'username',
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody).toHaveProperty('message');
    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[0]).toEqual(
      'password must be longer than or equal to 2 characters',
    );
    expect(validationResponseBody.message[1]).toEqual(
      'password must be a string',
    );
    expect(validationResponseBody).toHaveProperty('error');
    expect(validationResponseBody.error).toEqual('Bad Request');
    expect(validationResponseBody).toHaveProperty('statusCode');
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it('It should not store credentials with password too short', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        username: 'username',
        password: 'a',
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody).toHaveProperty('message');
    expect(validationResponseBody.message).toHaveLength(1);
    expect(validationResponseBody.message[0]).toEqual(
      'password must be longer than or equal to 2 characters',
    );
    expect(validationResponseBody).toHaveProperty('error');
    expect(validationResponseBody.error).toEqual('Bad Request');
    expect(validationResponseBody).toHaveProperty('statusCode');
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it('It should not store credentials with password wrong type', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        username: 'username',
        password: false,
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody).toHaveProperty('message');
    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[0]).toEqual(
      'password must be longer than or equal to 2 characters',
    );
    expect(validationResponseBody.message[1]).toEqual(
      'password must be a string',
    );
    expect(validationResponseBody).toHaveProperty('error');
    expect(validationResponseBody.error).toEqual('Bad Request');
    expect(validationResponseBody).toHaveProperty('statusCode');
    expect(validationResponseBody.statusCode).toEqual(400);
  });
});
