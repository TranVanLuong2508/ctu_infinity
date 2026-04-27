import { PartialType } from '@nestjs/mapped-types';
import { CreateCriteriaFrameDto } from './create-criteria-frame.dto';

export class UpdateCriteriaFrameDto extends PartialType(CreateCriteriaFrameDto) {}
