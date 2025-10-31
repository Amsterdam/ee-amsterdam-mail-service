import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PreviewController } from './preview/preview.controller.js';
import PreviewRenderer from './preview/preview.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [PreviewController],
  providers: [PreviewRenderer],
})
export class AppModule {}
