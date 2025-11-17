import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PreviewRequestDto } from './preview.dto';
import { ApiOAuth2, ApiOkResponse } from '@nestjs/swagger';
import PreviewRenderer from './preview';

@ApiOAuth2(['preview'])
@Controller('preview')
export class PreviewController {
  public constructor(private readonly renderer: PreviewRenderer) {}

  @Post()
  @HttpCode(200)
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
