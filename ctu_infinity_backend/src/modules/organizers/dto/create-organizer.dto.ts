import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateOrganizerDto {
  @IsNotEmpty({ message: 'Organizer Name must be not empty' })
  @IsString({ message: 'Organizer Name must be a string' })
  organizerName: string;

  @IsOptional()
  @IsString({ message: 'Organizer description must be a string' })
  description?: string;

  @IsUUID()
  @IsNotEmpty({ message: 'User ID must be not empty' })
  userId: string;

  // @IsOptional()
  // @IsUUID()
  // isActivatedBy?: string;
}

