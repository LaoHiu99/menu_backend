import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { UPLOADS_ROOT } from './upload.paths';

async function bootstrap() {
  const uploadsDir = UPLOADS_ROOT;
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
