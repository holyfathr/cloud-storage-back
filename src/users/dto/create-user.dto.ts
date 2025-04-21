import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    default: 'name@email.ru',
  })
  email: string;

  @ApiProperty({
    default: 'FirstName SecondName',
  })
  fullName: string;

  @ApiProperty({
    default: 'password',
  })
  password: string;
}
