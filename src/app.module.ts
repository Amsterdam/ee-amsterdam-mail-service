import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PreviewController } from './preview/preview.controller';
import PreviewRenderer from './preview/preview';
import Joi from 'joi';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import OktaJwtVerifier, { type VerifierOptions } from '@okta/jwt-verifier';
import { JWKSUriResolver, JWTHeaderVerifier } from './auth';
import { AuthGuard } from './auth.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { InvalidAuthorizationHeaderExceptionFilter } from './auth-exception.filter';

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
        OIDC_ISSUER: Joi.string()
          .uri()
          .default('http://localhost:8002/realms/amsterdam-mail-service'),
        OIDC_AUDIENCE: Joi.string().default('amsterdam-mail-service'),
        OIDC_ALGORITHMS: Joi.string().default('RS256,RS384,RS512'),
        OIDC_DISCOVERY_URL: Joi.string()
          .uri()
          .default(
            'http://keycloak:8002/realms/amsterdam-mail-service/.well-known/openid-configuration',
          ),
        OIDC_CLIENT_ID: Joi.string().default('amsterdam-mail-service'),
        OIDC_CHECK_TYP_HEADER: Joi.boolean().default(true),
        SWAGGER_UI_OIDC_DISCOVERY_URL: Joi.string()
          .uri()
          .default(
            'http://localhost:8002/realms/amsterdam-mail-service/.well-known/openid-configuration',
          ),
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
    {
      provide: JWKSUriResolver,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService): JWKSUriResolver => {
        return new JWKSUriResolver(
          // @ts-expect-error TS2345
          configuration.get<string>('OIDC_DISCOVERY_URL'),
        );
      },
    },
    {
      provide: OktaJwtVerifier,
      inject: [ConfigService, JWKSUriResolver],
      useFactory: async (
        configuration: ConfigService,
        jwksUriResolver: JWKSUriResolver,
      ): Promise<OktaJwtVerifier> => {
        const jwksUri = await jwksUriResolver.resolve();

        const verifierOptions: VerifierOptions = {
          // @ts-expect-error TS2345
          issuer: configuration.get<string>('OIDC_ISSUER'),
          jwksUri: jwksUri,
        };

        // Disable the https check for environments other than 'production'
        const nodeEnv = configuration.get<string>('NODE_ENV');
        if (nodeEnv !== 'production') {
          verifierOptions.testing = {
            disableHttpsCheck: true,
          };
        }

        return new OktaJwtVerifier(verifierOptions);
      },
    },
    {
      provide: JWTHeaderVerifier,
      inject: [ConfigService],
      useFactory: (configuration: ConfigService): JWTHeaderVerifier => {
        return new JWTHeaderVerifier(
          // @ts-expect-error TS2345
          configuration.get<string>('OIDC_ALGORITHMS'),
          configuration.get<boolean>('OIDC_CHECK_TYP_HEADER'),
        );
      },
    },
    {
      provide: APP_GUARD,
      inject: [ConfigService, JWTHeaderVerifier, OktaJwtVerifier],
      useFactory: (
        configuration: ConfigService,
        headerVerifier: JWTHeaderVerifier,
        jwtVerifier: OktaJwtVerifier,
      ): AuthGuard => {
        return new AuthGuard(
          headerVerifier,
          jwtVerifier,
          // @ts-expect-error TS2345
          configuration.get<string>('OIDC_AUDIENCE'),
        );
      },
    },
    {
      provide: APP_FILTER,
      useClass: InvalidAuthorizationHeaderExceptionFilter,
    }
  ],
})
export class AppModule {}
