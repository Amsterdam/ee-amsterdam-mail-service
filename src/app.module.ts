import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PreviewController } from './preview/preview.controller';
import PreviewRenderer from './preview/preview';
import Joi from 'joi';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      validationSchema: Joi.object({
        APP_BASE_URL: Joi.string().uri().default('http://localhost:3001'),
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        NODE_OPTIONS: Joi.string()
          .pattern(
            new RegExp(
              '--experimental-loader=@opentelemetry\\/instrumentation\\/hook\\.mjs',
            ),
            {
              name: '--experimental-loader=@opentelemetry\\/instrumentation\\/hook\\.mjs',
            },
          )
          .pattern(new RegExp('--import \\/app\\/src\\/telemetry\\.ts'), {
            name: '--import \\/app\\/src\\/telemetry\\.ts',
          })
          .required(),
        PORT: Joi.number().port().default(3001),
        OIDC_ISSUER: Joi.string().default(
          'http://localhost:8002/realms/amsterdam-mail-service',
        ),
        OIDC_AUDIENCE: Joi.string().default('amsterdam-mail-service'),
        OIDC_ALGORITHMS: Joi.string().default('RS256,RS384,RS512'),
        OIDC_DISCOVERY_URL: Joi.string()
          .uri()
          .default('http://localhost:8002/realms/amsterdam-mail-service/.well-known/openid-configuration'),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(import.meta.dirname, '..', 'public'),
    }),
  ],
  controllers: [PreviewController],
  providers: [
    ConfigService,
    {
      provide: PreviewRenderer,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService): PreviewRenderer => {
        const baseUrl = configuration.get<string>('APP_BASE_URL');
        // @ts-expect-error TS2345
        return new PreviewRenderer(baseUrl);
      },
    },
  ],
})
export class AppModule {}
