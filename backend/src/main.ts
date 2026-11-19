import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { runSeeds } from './database/seeds/run-seed';

async function bootstrap() {
  const logger = new Logger('BK-Delivery-Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // CORS para el frontend Next.js
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validaciones globales de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Documentacion OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BK Delivery - API Empresarial')
    .setDescription(
      'Sistema integral para administracion de negocio gastronomico: Ventas, POS, Inventario, Caja, Facturacion e Impresion, Domicilios y Finanzas.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Ejecucion automatica de semillas iniciales
  try {
    const dataSource = app.get(DataSource);
    await runSeeds(dataSource);
  } catch (err: unknown) {
    const e = err as Error;
    logger.warn(`Nota sobre semillas: ${e.message}`);
  }

  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`BK Delivery Backend corriendo en puerto: ${port}`);
  logger.log(`Documentacion Swagger: http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}

bootstrap();
