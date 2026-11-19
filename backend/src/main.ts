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

  // Configuración global de prefijo de API
  app.setGlobalPrefix('api');

  // CORS habilitado para el frontend de Next.js
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

  // Documentación OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BK Delivery - API Empresarial')
    .setDescription(
      'Sistema integral para administración de negocio gastronómico: Ventas, POS, Inventario, Caja, Facturación e Impresión, Domicilios y Finanzas.',
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

  // Ejecución automática de semillas iniciales si la base de datos está limpia
  try {
    const dataSource = app.get(DataSource);
    await runSeeds(dataSource);
  } catch (err: any) {
    logger.warn(`Nota sobre semillas: ${err.message}`);
  }

  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(`🚀 Servidor BK Delivery Backend corriendo en puerto: ${port}`);
  logger.log(`📖 Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}

bootstrap();
