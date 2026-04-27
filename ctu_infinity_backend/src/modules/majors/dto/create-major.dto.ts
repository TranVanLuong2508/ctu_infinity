import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMajorDto {
  @IsNotEmpty({ message: 'Major name is required' })
  @IsString({ message: 'Major name must be a string' })
  majorName: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsNotEmpty({ message: 'Faculty is required' })
  @IsUUID('4', { message: 'Invalid faculty ID' })
  falcultyId: string;
}
