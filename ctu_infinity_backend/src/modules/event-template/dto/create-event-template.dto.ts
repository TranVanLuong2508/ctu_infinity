import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEventTemplateDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsUUID()
    organizerId?: string;
}
