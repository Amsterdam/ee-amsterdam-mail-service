import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SendRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
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

  @ApiProperty()
  @IsEmail()
  // @ts-expect-error TS2564
  from: string;

  @ApiProperty()
  @IsEmail()
  // @ts-expect-error TS2564
  to: string;

  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  subject: string;
}

export class SendResponseDto {
  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  message: string;
}

export class SendResponseDtoFactory {
  public produce(message: string): SendResponseDto {
    const dto = new SendResponseDto();
    dto.message = message;

    return dto;
  }
}
