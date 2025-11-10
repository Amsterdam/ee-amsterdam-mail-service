import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PreviewRequestDto {
  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  title: string;

  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  previewText: string;

  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  bodyText: string;
}
