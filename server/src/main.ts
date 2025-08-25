import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './logger/logger.service';
import { AllExceptionsFilter } from './logger/all-exceptions.filter';
import { LoggerMiddleware } from './logger/logger.middleware';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();

  const appLogger = new AppLogger();

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter(appLogger));

  // Request logging middleware
  app.use((req, res, next) => new LoggerMiddleware(appLogger).use(req, res, next));

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Classcraft Hub API')
    .setDescription('The Classcraft Hub API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
  appLogger.log('🚀 Server running at http://localhost:3000/api');
  appLogger.log('📜 Swagger at http://localhost:3000/api-docs');
}
bootstrap();
