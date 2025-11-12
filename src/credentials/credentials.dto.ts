import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CredentialsRequestDto {
  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  username: string;

  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  password: string;
}

export class CredentialsResponseDto {
  @ApiProperty()
  @IsString()
  // @ts-expect-error TS2564
  message: string;
}
