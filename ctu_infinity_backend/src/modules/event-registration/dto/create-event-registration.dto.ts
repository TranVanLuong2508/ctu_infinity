import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateEventRegistrationDto {
    @IsNotEmpty()
    @IsUUID()
    studentId: string;

    @IsNotEmpty()
    @IsUUID()
    eventId: string;
}
