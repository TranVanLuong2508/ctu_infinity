import { PartialType } from '@nestjs/mapped-types';
import { CreateAcademicYearDto } from './create-academic_year.dto';

export class UpdateAcademicYearDto extends PartialType(CreateAcademicYearDto) {}
