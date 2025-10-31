import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PreviewRequestDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  previewText: string;

  @ApiProperty()
  @IsString()
  bodyText: string;
}
