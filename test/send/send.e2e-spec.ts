import request from 'supertest';
import { MailpitClient } from 'mailpit-api';
import { readFileSync } from 'fs';
import { format } from 'util';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
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
import { assertIsValidationResponseBody, deleteCredentials } from 'test/utils';
import { SecretClient } from '@azure/keyvault-secrets';

const mailpitClient = new MailpitClient('http://mailpit:8025');
const from = 'me@example.com';
const to = 'you@example.com';
const subject = 'My subject';
const expectedText = `MY TITLE\r\n\r\n\r\nBODY TEXT\r\n\r\n * list1\r\n * list2\r\n\r\n----------------------------------------\r\n\r\nDisclaimer teksten zijn altijd superleuk om te lezen!\r\n\r\nAmsterdam.nl https://amsterdam.nl/\r\n\r\n14020 tel:14020`;
const getExpectedHtml = (id: string): string => {
  const expected = readFileSync(
    './test/resources/sendMailBody.html',
    { encoding: 'utf-8' },
  );
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

  it("It should send mail with a valid token", async () => {
    await mailpitClient.deleteMessages();

    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const credentialsResponse = await request(app.getHttpServer())
      .post("/credentials")
      .send({ username: "test_smtp_user", password: "smtp_secret" })
      .set("Authorization", `Bearer ${body.access_token}`);

    expect(credentialsResponse.statusCode).toEqual(200);

    const response = await request(app.getHttpServer())
      .post(url)
      .send(requestBody)
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual("Mail sent successfully!");

    const mailpitResponse = await mailpitClient.listMessages();
    expect(mailpitResponse.total).toEqual(1);

    const messageSummary = mailpitResponse.messages[0];
    expect(messageSummary.From.Address).toEqual(from);
    expect(messageSummary.To).toHaveLength(1);
    expect(messageSummary.To[0].Address).toEqual(to);
    expect(messageSummary.Subject).toEqual(subject);

    const messageText = await mailpitClient.renderMessageText(
      messageSummary.ID,
    );
    expect(messageText).toEqual(expectedText);

    const messageHtml = await mailpitClient.renderMessageHTML(
      messageSummary.ID,
    );
    expect(messageHtml).toEqual(getExpectedHtml(messageSummary.ID));

    const searchResponse = await mailpitClient.searchMessages({
      query: "has:inline",
    });
    expect(searchResponse.messages_count).toEqual(1);

    await deleteCredentials(app.get(SecretClient));
  });

  it("It should not send mail with a valid token, but no credentials in keyvault", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send(requestBody)
      .set("Authorization", `Bearer ${body.access_token}`);

    expect(response.statusCode).toEqual(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toEqual(
      "Credentials not found. Did you add them using the /credentials endpoint?",
    );
  });

  it("title missing", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        previewText: "preview text",
        bodyText: "body text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[1]).toEqual('title must be a string');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it("title too short", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        title: "a",
        previewText: "preview text",
        bodyText: "body text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(1);
    expect(validationResponseBody.message[0]).toEqual('title must be longer than or equal to 2 characters');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it("title wrong type", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        title: false,
        previewText: "preview text",
        bodyText: "body text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[1]).toEqual('title must be a string');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it("previewText missing", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        title: "title",
        bodyText: "body text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);
    const validationResponseBody: unknown = response.body;

    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[1]).toEqual('previewText must be a string');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it("previewText too short", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        title: "title",
        previewText: "a",
        bodyText: "body text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(1);
    expect(validationResponseBody.message[0]).toEqual('previewText must be longer than or equal to 2 characters');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it("previewText wrong type", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        title: "title",
        previewText: false,
        bodyText: "body text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);

    const validationResponseBody: unknown = response.body;
    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[1]).toEqual('previewText must be a string');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  it("bodyText missing", async () => {
    const tokenResponse = await getToken();
    const body: unknown = tokenResponse.body;
    assertIsTokenResponseBody(body);

    const response = await request(app.getHttpServer())
      .post(url)
      .send({
        title: "title",
        previewText: "preview text",
        from: "me@example.com",
        to: "you@example.com",
        subject: "subject",
      })
      .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

    expect(response.statusCode).toEqual(400);
    const validationResponseBody: unknown = response.body;

    assertIsValidationResponseBody(validationResponseBody);

    expect(validationResponseBody.message).toHaveLength(2);
    expect(validationResponseBody.message[1]).toEqual('bodyText must be a string');
    expect(validationResponseBody.error).toEqual("Bad Request");
    expect(validationResponseBody.statusCode).toEqual(400);
  });

  // it("bodyText too short", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "a",
  //       from: "me@example.com",
  //       to: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("bodyText");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "minLength.openapi.requestValidation",
  //   );
  //   expect(response.body.errors[0].message).toEqual(
  //     "must NOT have fewer than 2 characters",
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("bodyText wrong type", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: false,
  //       from: "me@example.com",
  //       to: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("bodyText");
  //   expect(response.body.errors[0].message).toEqual("must be string");
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("subject missing", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       from: "me@example.com",
  //       to: "you@example.com",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("subject");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "required.openapi.requestValidation",
  //   );
  //   expect(response.body.errors[0].message).toEqual(
  //     "must have required property 'subject'",
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("subject too short", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       from: "me@example.com",
  //       to: "you@example.com",
  //       subject: "s",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("subject");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "minLength.openapi.requestValidation",
  //   );
  //   expect(response.body.errors[0].message).toEqual(
  //     "must NOT have fewer than 2 characters",
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("subject wrong type", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       from: "me@example.com",
  //       to: "you@example.com",
  //       subject: false,
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("subject");
  //   expect(response.body.errors[0].message).toEqual("must be string");
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("from missing", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       to: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("from");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "required.openapi.requestValidation",
  //   );
  //   expect(response.body.errors[0].message).toEqual(
  //     "must have required property 'from'",
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("from wrong type", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       from: false,
  //       to: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("from");
  //   expect(response.body.errors[0].message).toEqual("must be string");
  //   expect(response.body.errors[0].location).toEqual("body");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "type.openapi.requestValidation",
  //   );
  // });

  // it("from not valid email address", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       from: "hello",
  //       to: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("from");
  //   expect(response.body.errors[0].message).toEqual(
  //     'must match format "email"',
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "format.openapi.requestValidation",
  //   );
  // });

  // it("to missing", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       from: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("to");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "required.openapi.requestValidation",
  //   );
  //   expect(response.body.errors[0].message).toEqual(
  //     "must have required property 'to'",
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  // });

  // it("to wrong type", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       to: false,
  //       from: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${tokenResponse.body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("to");
  //   expect(response.body.errors[0].message).toEqual("must be string");
  //   expect(response.body.errors[0].location).toEqual("body");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "type.openapi.requestValidation",
  //   );
  // });

  // it("to not valid email address", async () => {
  //   const tokenResponse = await getToken();
  //   const body: unknown = tokenResponse.body;
  //   assertIsTokenResponseBody(body);

  //   const response = await request(app.getHttpServer())
  //     .post(url)
  //     .send({
  //       title: "title",
  //       previewText: "preview text",
  //       bodyText: "body text",
  //       to: "hello",
  //       from: "you@example.com",
  //       subject: "subject",
  //     })
  //     .set("Authorization", `Bearer ${body.access_token}`);

  //   expect(response.statusCode).toEqual(422);
  //   expect(response.body).toHaveProperty("errors");
  //   expect(response.body.errors).toHaveLength(1);
  //   expect(response.body.errors[0].path).toEqual("to");
  //   expect(response.body.errors[0].message).toEqual(
  //     'must match format "email"',
  //   );
  //   expect(response.body.errors[0].location).toEqual("body");
  //   expect(response.body.errors[0].errorCode).toEqual(
  //     "format.openapi.requestValidation",
  //   );
  // });
});
