import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as bodyParser from "body-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import configuration from "./config/configuration";
import { SecurityConfig } from "./config/security.config";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { RequestInterceptor } from "./interceptors/interceptor.request";
import { TransformInterceptor } from "./interceptors/interceptor.transform-response";
import { PrismaService } from "./modules/prisma/prisma.service";
import { SeedService } from "./seeds";

const logger = new Logger("NestApplication");

async function bootstrap() {
  // Validate security environment variables
  SecurityConfig.validateEnvironment();

  const app = await NestFactory.create(AppModule); // CORS sẽ được cấu hình bằng SecurityConfig

  // Enable security headers with helmet
  app.use(helmet(SecurityConfig.getHelmetConfig()));

  app.enableVersioning({
    type: VersioningType.URI
  });
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new RequestInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true, // Reject requests with non-whitelisted properties
      disableErrorMessages: process.env.NODE_ENV === "production" // Hide error details in production
    })
  );

  app.use(bodyParser.json({ limit: "10mb" })); // Reduced from 100mb for security
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  const prismaService = app.get(PrismaService);

  // Setup graceful shutdown
  app.enableShutdownHooks();

  // Handle shutdown signals properly
  process.on("SIGINT", async () => {
    await app.close();
    await prismaService.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await app.close();
    await prismaService.$disconnect();
    process.exit(0);
  });

  const seedService = new SeedService();
  await seedService.run();

  // Configure CORS with security options
  app.enableCors(SecurityConfig.getCorsOptions());

  await app.listen(configuration.port);
}

bootstrap().then(() => logger.log(`Server running on port ${configuration.port}`));
