import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateFalcultyDto {
  @IsNotEmpty({ message: 'Falculty Name must be not empty' })
  @IsString({ message: 'Falculty Name must be a string' })
  falcultyName: string;

  @IsOptional()
  @IsString({ message: 'Falculty description must be a string' })
  description?: string;
}

