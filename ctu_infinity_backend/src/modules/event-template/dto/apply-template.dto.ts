import {
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ApplyTemplateDto {
    @IsNotEmpty()
    @IsUUID()
    templateId: string;

    @IsOptional()
    @IsString()
    eventName?: string;

    @IsOptional()
    @IsString()
    organizer?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxParticipants?: number;

    @IsOptional()
    @IsString()
    aiPrompt?: string;
}
