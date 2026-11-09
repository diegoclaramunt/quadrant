import { Module } from '@nestjs/common';
import { join } from 'node:path';
import { createQuadrantApp, QuadrantApp } from '@quadrant/application';
import { openStore } from '@quadrant/storage';
import { AppController } from './app.controller';
import { VoiceController } from './voice.controller';

@Module({
  imports: [],
  controllers: [AppController, VoiceController],
  providers: [
    {
      provide: QuadrantApp,
      useFactory: () => {
        const filename =
          process.env.QUADRANT_DB ??
          join(process.cwd(), '.data', 'quadrant.sqlite');
        return createQuadrantApp(openStore(filename));
      },
    },
  ],
})
export class AppModule {}
