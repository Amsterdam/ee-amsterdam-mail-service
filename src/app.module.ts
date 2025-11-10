import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PreviewController } from './preview/preview.controller';
import PreviewRenderer from './preview/preview';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [PreviewController],
  providers: [PreviewRenderer],
})
export class AppModule {}
