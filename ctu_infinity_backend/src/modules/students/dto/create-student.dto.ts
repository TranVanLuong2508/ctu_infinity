import {
    IsString,
    IsUUID,
    IsInt,
    IsOptional,
    IsNotEmpty,
} from 'class-validator';

export class CreateStudentDto {
    @IsString()
    @IsNotEmpty(({ message: 'studentCode must be not empty' }))
    studentCode: string;

    @IsUUID()
    @IsNotEmpty(({ message: 'userId must be not empty' }))
    userId: string;

    @IsUUID()
    @IsOptional()
    classId?: string;

    @IsInt()
    @IsNotEmpty(({ message: 'enrollmentYear must be not empty' }))
    enrollmentYear: number;
}

