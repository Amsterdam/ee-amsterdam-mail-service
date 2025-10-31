import { Body, Controller, Post } from '@nestjs/common';
import { PreviewRequestDto } from './preview.dto.js';
import { ApiOkResponse } from '@nestjs/swagger';
import PreviewRenderer from './preview.js';

@Controller('preview')
export class PreviewController {
  public constructor(private readonly renderer: PreviewRenderer) {}

  @Post()
  @ApiOkResponse({
    description: 'OK',
    content: {
      'text/html': {},
    },
  })
  public async preview(
    @Body() previewRequestDto: PreviewRequestDto,
  ): Promise<string> {
    return this.renderer.preview(
      previewRequestDto.title,
      previewRequestDto.previewText,
      previewRequestDto.bodyText,
    );
  }
}
