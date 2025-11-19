import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PreviewRequestDto } from './preview.dto';
import {
  ApiBadRequestResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
  @ApiBadRequestResponse({
    headers: {
      'www-authenticate': {
        description: 'May contain information on authentication failures',
      },
    },
  })
  @ApiUnauthorizedResponse({
    headers: {
      'www-authenticate': {
        description: 'Contains information on authentication failures',
      },
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
