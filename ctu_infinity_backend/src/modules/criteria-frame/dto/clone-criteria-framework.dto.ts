import { IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsDateString, IsOptional } from 'class-validator';

export class CloneCriteriaFrameworkDto {
    @IsNotEmpty({ message: 'Framework name is required' })
    @IsString({ message: 'Framework name must be a string' })
    @MinLength(3, { message: 'Framework name must be at least 3 characters' })
    @MaxLength(200, { message: 'Framework name cannot exceed 200 characters' })
    frameworkName: string;

    @IsNotEmpty({ message: 'Version is required' })
    @IsString({ message: 'Version must be a string' })
    @Matches(/^v\d+\.\d+$/, {
        message: 'Version must follow format: v{major}.{minor} (e.g., v1.0, v2.1)',
    })
    version: string;

    @IsNotEmpty({ message: 'Start date is required' })
    @IsDateString({}, { message: 'Start date must be a valid date' })
    startDate: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    description?: string;
}
