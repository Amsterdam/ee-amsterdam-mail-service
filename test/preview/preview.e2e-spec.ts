import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';

describe('PreviewController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/preview (POST)', async () => {
    const response = await request(app.getHttpServer()).post('/preview').send({
      title: 'My Title',
      previewText: 'My Preview Text',
      bodyText: 'My Body Text',
    });

    expect(response.statusCode).toEqual(200);

    const expectedPreviewResponseBody = readFileSync(
      './test/resources/previewResponse.html',
      { encoding: 'utf-8' },
    );

    expect(response.text).toEqual(expectedPreviewResponseBody);
  });
});
