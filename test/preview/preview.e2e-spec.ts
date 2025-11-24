import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
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

const requestBody = {
  title: 'My Title',
  previewText: 'My preview text',
  bodyText: '# Body text\n- list1\n- list2',
};
const url = '/preview';

describe('PreviewController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('It should not generate a preview with no token provided', async () => {
    await test_no_token_provided(app, url, requestBody);
  });

  it('It should not generate a preview with typ missing from header', async () => {
    await test_header_missing_typ(app, url, requestBody);
  });

  it('It should not generate a preview with alg missing from header', async () => {
    await test_header_missing_alg(app, url, requestBody);
  });

  it('It should not generate a preview with alg and typ missing from header', async () => {
    await test_header_missing_alg_and_typ(app, url, requestBody);
  });

  it('It should not generate a preview with a invalid typ header in the access token', async () => {
    await test_invalid_typ_header(app, url, requestBody);
  });

  it('It should not generate a preview with an invalid audience in the access token', async () => {
    await test_invalid_audience(app, url, requestBody);
  });

  it('It should not generate a preview with an expired access token', async () => {
    await test_expired_token(app, url, requestBody);
  });

  it('It should not generate a preview with a invalid alg header in the access token', async () => {
    await test_invalid_alg_header(app, url, requestBody);
  });

  it('It should not generate a preview and a invalid signature in the access token', async () => {
    await test_invalid_signature(app, url, requestBody);
  });

  it('It should not generate a preview a invalid issuer in the access token', async () => {
    await test_invalid_issuer(app, url, requestBody);
  });

  it('It should generate a preview with a valid token', async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post('/preview')
      .send({
        title: 'My Title',
        previewText: 'My Preview Text',
        bodyText: 'My Body Text',
      })
      .set('Authorization', `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(200);

    const expectedPreviewResponseBody = readFileSync(
      './test/resources/previewResponse.html',
      { encoding: 'utf-8' },
    );

    expect(response.text).toEqual(expectedPreviewResponseBody);
  });
});
