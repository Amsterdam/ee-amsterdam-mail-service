import { MailpitClient } from 'mailpit-api';
import { readFileSync } from 'fs';
import { format } from 'util';
import { beforeEach, describe, it } from 'vitest';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import {
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

const mailpitClient = new MailpitClient('http://mailpit:8025');
const from = 'me@example.com';
const to = 'you@example.com';
const subject = 'My subject';
const expectedText = `MY TITLE\r\n\r\n\r\nBODY TEXT\r\n\r\n * list1\r\n * list2\r\n\r\n--------------------------------------------------------------------------------\r\n\r\nDisclaimer teksten zijn altijd superleuk om te lezen!\r\n\r\nAmsterdam.nl https://amsterdam.nl/\r\n\r\n14020 tel:14020`;
const getExpectedHtml = (id: string): string => {
  const expected = readFileSync(__dirname + '/expected.html', {
    encoding: 'utf8',
  });
  return format(expected, id, id);
};
const requestBody = {
  title: 'My Title',
  previewText: 'My preview text',
  bodyText: '# Body text\n- list1\n- list2',
  from: from,
  to: to,
  subject: subject,
};
const url = '/send';

describe('SendController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('It should not send mail with no token provided', async () => {
    await test_no_token_provided(app, url, requestBody);
  });

  it('It should not send mail with typ missing from header', async () => {
    await test_header_missing_typ(app, url, requestBody);
  });

  it('It should not send mail with alg missing from header', async () => {
    await test_header_missing_alg(app, url, requestBody);
  });

  it('It should not send mail with alg and typ missing from header', async () => {
    await test_header_missing_alg_and_typ(app, url, requestBody);
  });

  it('It should not send mail with a invalid typ header in the access token', async () => {
    await test_invalid_typ_header(app, url, requestBody);
  });

  it('It should not send mail with an invalid audience in the access token', async () => {
    await test_invalid_audience(app, url, requestBody);
  });

  it('It should not send mail with an expired access token', async () => {
    await test_expired_token(app, url, requestBody);
  });

  it('It should not send mail with a invalid alg header in the access token', async () => {
    await test_invalid_alg_header(app, url, requestBody);
  });

  it('It should not send mail with a invalid signature in the access token', async () => {
    await test_invalid_signature(app, url, requestBody);
  });

  it('It should not send mail with a invalid issuer in the access token', async () => {
    await test_invalid_issuer(app, url, requestBody);
  });
});
