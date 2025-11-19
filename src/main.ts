import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Amsterdam Mail Service')
    .setDescription('The mail service for sending transactional mail.')
    .setVersion('1.0')
    .addTag('mail')
    .addOAuth2({
      type: 'openIdConnect',
      openIdConnectUrl:
        process.env.SWAGGER_UI_OIDC_DISCOVERY_URL ??
        'http://localhost:8002/realms/amsterdam-mail-service/.well-known/openid-configuration',
    })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
