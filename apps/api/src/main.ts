import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // En producción el mismo proceso sirve la web compilada (SPA).
  const webDir = process.env.QUADRANT_WEB_DIR
    ? resolve(process.env.QUADRANT_WEB_DIR)
    : undefined;
  if (webDir && existsSync(join(webDir, 'index.html'))) {
    app.useStaticAssets(webDir, { index: false });
    const index = join(webDir, 'index.html');
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' || req.path.startsWith(`/${globalPrefix}`))
        return next();
      res.sendFile(index);
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Quadrant en http://localhost:${port} (API en /${globalPrefix})`);
}

bootstrap();
