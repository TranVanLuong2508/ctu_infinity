import { PartialType } from '@nestjs/mapped-types';
import { CreateFalcultyDto } from './create-falculty.dto';

export class UpdateFalcultyDto extends PartialType(CreateFalcultyDto) {}
