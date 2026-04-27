import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentScoreDto } from './create-student-score.dto';

export class UpdateStudentScoreDto extends PartialType(CreateStudentScoreDto) {}
