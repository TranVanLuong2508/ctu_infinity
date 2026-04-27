import {
    IsString,
    IsUUID,
    IsInt,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';

export class CreateClassDto {
    @IsString()
    @IsNotEmpty({ message: 'Class name must not be empty' })
    className: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    majorId?: string;

    @IsInt()
    @IsNotEmpty({ message: 'Academic year must not be empty' })
    academicYear: number;
}
