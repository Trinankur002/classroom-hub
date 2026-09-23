import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './logger/logger.service';
import { AllExceptionsFilter } from './logger/all-exceptions.filter';
import { LoggerMiddleware } from './logger/logger.middleware';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  dotenv.config();

  const appLogger = new AppLogger();

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter(appLogger));

  // Request logging middleware
  app.use((req, res, next) => new LoggerMiddleware(appLogger).use(req, res, next));
  
  // const frontendUrl = process.env.FRONTEND_URL;

  // 🔥 CORS: allow from anywhere and handle credentials
  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health', 'api/health'],
  });
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

  // Serve frontend SPA in single-container deployment if build artifacts exist
  const clientPaths = [
    process.env.CLIENT_BUILD_PATH,
    path.resolve(__dirname, '../client'), // Docker container layout (/app/client)
    path.resolve(__dirname, '../../web/dist'), // Monorepo build layout
  ].filter(Boolean) as string[];

  for (const clientPath of clientPaths) {
    if (fs.existsSync(clientPath)) {
      const express = require('express');
      const expressApp = app.getHttpAdapter().getInstance();
      expressApp.use(express.static(clientPath));
      expressApp.use((req: any, res: any, next: any) => {
        if (
          req.method !== 'GET' ||
          req.path.startsWith('/api') ||
          req.path.startsWith('/socket.io') ||
          req.path.startsWith('/health')
        ) {
          return next();
        }
        res.sendFile(path.join(clientPath, 'index.html'));
      });
      appLogger.log(`📦 Serving frontend SPA from ${clientPath}`);
      break;
    }
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  appLogger.log(`🚀 Server running at http://localhost:${port}/api`);
  appLogger.log(`📜 Swagger at http://localhost:${port}/api-docs`);
}
bootstrap();
