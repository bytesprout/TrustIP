import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import type { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const isDevelopment = configService.isDevelopment;
  const port = configService.port;

  // Security: HTTP security headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.adminUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
  });

  // Global API prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Global filters and interceptors
  const loggingInterceptor = app.get(LoggingInterceptor);
  const responseInterceptor = app.get(ResponseInterceptor);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(loggingInterceptor, responseInterceptor);

  // Swagger
  if (isDevelopment || configService.appEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TrustIP API')
      .setDescription(
        'TrustIP — IP Intelligence, Trust Scoring & Anti-Abuse Platform API',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'x-api-key')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('health', 'Health checks')
      .addTag('feature-flags', 'Feature flag management')
      .addTag('system', 'System administration')
      .addTag('ip', 'IP intelligence, trust scoring, and threat detection')
      .addTag('internal', 'Internal operational endpoints (dataset health etc.)')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  const logger = app.get(LoggingInterceptor);
  void logger; // Used via interceptor - silence unused warning
}

void bootstrap();
