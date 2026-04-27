import {
    IsString,
    IsOptional,
    IsEnum,
    IsInt,
    IsDateString,
    IsUUID,
} from 'class-validator';
import { UserGender } from '../entities/user.entity';

export class UpdateBasicInfoDto {
    @IsOptional()
    @IsString({ message: 'fullName must be a string' })
    fullName?: string;

    @IsOptional()
    @IsString({ message: 'phoneNumber must be a string' })
    phoneNumber?: string;

    @IsOptional()
    @IsEnum(UserGender, { message: 'gender must be male, female or other' })
    gender?: UserGender;

    @IsOptional()
    @IsDateString({}, { message: 'birthDate must be a valid date string' })
    birthDate?: string;

    @IsOptional()
    @IsInt({ message: 'age must be an integer' })
    age?: number;

    @IsOptional()
    @IsUUID(undefined, { message: 'roleId must be a valid UUID' })
    roleId?: string;

    @IsOptional()
    @IsString({ message: 'avatarUrl must be a string' })
    avatarUrl?: string;
}
