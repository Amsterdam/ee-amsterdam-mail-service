import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CredentialsRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
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

export class CredentialsResponseDtoFactory {
  public produce(message: string): CredentialsResponseDto {
    const response = new CredentialsResponseDto();
    response.message = message;

    return response;
  }
}
