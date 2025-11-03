import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PreviewRequestDto {
  @ApiProperty()
  @IsString()
  // @ts-ignore TS2564
  title: string;

  @ApiProperty()
  @IsString()
  // @ts-ignore TS2564
  previewText: string;

  @ApiProperty()
  @IsString()
  // @ts-ignore TS2564
  bodyText: string;
}
